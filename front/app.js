import { API_URL } from "./config.js";
import { api } from "./api.js";

const $ = (selector, root = document) => root.querySelector(selector);

$("#docs-link").href = API_URL;

const dateFormat = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" });
const formatDate = (iso) => dateFormat.format(new Date(iso));

// Construit un élément sans jamais passer par innerHTML : les données de
// l'API (titres, noms) sont insérées comme du texte.
function el(tag, props = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (key === "class") node.className = value;
    else if (key.startsWith("on")) node.addEventListener(key.slice(2), value);
    else node.setAttribute(key, value);
  }
  node.append(...children);
  return node;
}

function button(label, onClick, className = "") {
  return el("button", { type: "button", class: className, onclick: onClick }, label);
}

function toast(message, isError = false) {
  const node = el("p", { class: isError ? "toast error" : "toast" }, message);
  $("#toasts").append(node);
  setTimeout(() => node.remove(), 5000);
}

// Exécute une action déclenchée par un bouton et affiche l'erreur de l'API.
async function run(action) {
  try {
    await action();
  } catch (error) {
    toast(error.message, true);
  }
}

function showFormError(dialog, error) {
  const target = $(".form-error", dialog);
  target.textContent = error ? error.message : "";
  target.hidden = !error;
}

for (const cancel of document.querySelectorAll("[data-cancel]")) {
  cancel.addEventListener("click", () => cancel.closest("dialog").close());
}

// Branche un formulaire de boîte de dialogue sur un appel à l'API.
// L'erreur renvoyée par l'API reste affichée dans la boîte, qui ne se ferme
// qu'en cas de succès.
function bindSubmit(dialog, form, handler) {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    showFormError(dialog, null);
    try {
      await handler(new FormData(form));
      dialog.close();
      await refresh();
    } catch (error) {
      showFormError(dialog, error);
    }
  });
}

// --- Onglets ---------------------------------------------------------------

const tabs = ["games", "members"];

function currentTab() {
  const name = location.hash.slice(1);
  return tabs.includes(name) ? name : "games";
}

async function refresh() {
  const tab = currentTab();
  for (const name of tabs) {
    $(`#${name}`).hidden = name !== tab;
    $(`[data-tab="${name}"]`).toggleAttribute("aria-current", name === tab);
  }
  await run(tab === "games" ? loadGames : loadMembers);
}

window.addEventListener("hashchange", refresh);

// --- Jeux ------------------------------------------------------------------

async function loadGames() {
  const games = await api.listGames();
  $("#games-empty").hidden = games.length > 0;
  $("#games-list").replaceChildren(...games.map(gameCard));
}

async function deleteGame(game) {
  console.log(game.id);
  api.deleteGame(game.id);
  console.log(game)
  loadGames();
}

function gameCard(game) {
  const players =
    game.minPlayers === game.maxPlayers ? `${game.minPlayers}` : `${game.minPlayers} à ${game.maxPlayers}`;
  const status = game.isAvailable
    ? el("span", { class: "badge ok" }, "Disponible")
    : el("span", { class: "badge busy" }, "Emprunté");

  const actions = el("div", { class: "actions" });
  if (game.isAvailable) {
    actions.append(button("Emprunter", () => openBorrowDialog(game), "primary"));
  }
  actions.append(button("Modifier", () => openBorrowDialog(game), "primary"));
  actions.append(button("Supprimer", () => deleteGame(game), "primary"));
  return el(
    "li",
    { class: "card" },
    el("div", { class: "card-head" }, el("h3", {}, game.title), status),
    el("p", { class: "meta" }, `${players} joueur·ses · ${game.durationMinutes} min`),
    actions,
  );
}

const gameDialog = $("#game-dialog");
const gameForm = $("#game-form");

$("#add-game").addEventListener("click", () => {
  gameForm.reset();
  showFormError(gameDialog, null);
  gameDialog.showModal();
});

bindSubmit(gameDialog, gameForm, (data) =>
  api.createGame({
    title: data.get("title").trim(),
    minPlayers: Number(data.get("minPlayers")),
    maxPlayers: Number(data.get("maxPlayers")),
    durationMinutes: Number(data.get("durationMinutes")),
  }),
);

// --- Emprunts --------------------------------------------------------------

const borrowDialog = $("#borrow-dialog");
const borrowForm = $("#borrow-form");
let borrowedGame = null;

async function openBorrowDialog(game) {
  await run(async () => {
    const members = await api.listMembers();
    if (members.length === 0) {
      toast("Ajoutez d'abord un·e adhérent·e pour pouvoir emprunter.", true);
      return;
    }
    borrowedGame = game;
    $("#borrow-dialog-title").textContent = `Emprunter « ${game.title} »`;
    $("select", borrowForm).replaceChildren(
      ...members.map((member) => el("option", { value: member.id }, `${member.name} (${member.email})`)),
    );
    showFormError(borrowDialog, null);
    borrowDialog.showModal();
  });
}

bindSubmit(borrowDialog, borrowForm, async (data) => {
  const loan = await api.borrow(borrowedGame.id, data.get("memberID"));
  toast(`« ${borrowedGame.title} » emprunté, à rendre avant le ${formatDate(loan.dueAt)}.`);
});

// --- Adhérent·es -----------------------------------------------------------

async function loadMembers() {
  const members = await api.listMembers();
  $("#members-empty").hidden = members.length > 0;
  $("#members-list").replaceChildren(...members.map(memberRow));
}

function memberRow(member) {
  return el(
    "li",
    { class: "row" },
    el("div", { class: "row-main" }, el("p", {}, el("strong", {}, member.name)), el("p", { class: "meta" }, member.email)),
  );
}

const memberDialog = $("#member-dialog");
const memberForm = $("#member-form");

$("#add-member").addEventListener("click", () => {
  memberForm.reset();
  showFormError(memberDialog, null);
  memberDialog.showModal();
});

bindSubmit(memberDialog, memberForm, (data) =>
  api.createMember({ name: data.get("name").trim(), email: data.get("email").trim() }),
);

refresh();
