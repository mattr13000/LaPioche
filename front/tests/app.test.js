import { assertEqual, assertIncludes, assertTrue, test, waitFor } from "./runner.js";
import { mountApp } from "./helpers.js";

const catan = { id: "g1", title: "Catan", minPlayers: 3, maxPlayers: 4, durationMinutes: 90, isAvailable: true };
const dixit = { id: "g2", title: "Dixit", minPlayers: 3, maxPlayers: 6, durationMinutes: 30, isAvailable: false };
const camille = { id: "m1", name: "Camille", email: "camille@example.com" };

const cardOf = (app, title) => app.$$("#games-list .card").find((card) => card.querySelector("h3").textContent === title);
const formatDate = (iso) => new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(new Date(iso));

// --- Jeux

test("games list shows one card per game with its availability", async () => {
  const app = await mountApp({ "GET /games": [catan, dixit] });
  await waitFor(() => app.$$("#games-list .card").length === 2, "deux cartes de jeu");
  assertIncludes(cardOf(app, "Catan").textContent, "Disponible");
  assertIncludes(cardOf(app, "Dixit").textContent, "Emprunté");
  assertIncludes(cardOf(app, "Catan").textContent, "3 à 4 joueur·ses · 90 min");
});

test("only an available game offers Borrow", async () => {
  const app = await mountApp({ "GET /games": [catan, dixit] });
  await waitFor(() => app.$$("#games-list .card").length === 2);
  const labels = (title) => [...cardOf(app, title).querySelectorAll("button")].map((button) => button.textContent);
  assertTrue(labels("Catan").includes("Emprunter"), "Catan devrait proposer Emprunter");
  assertTrue(!labels("Dixit").includes("Emprunter"), "Dixit est emprunté, il ne doit pas proposer Emprunter");
});

test("with no game, a message invites to add one", async () => {
  const app = await mountApp({ "GET /games": [] });
  await waitFor(() => !app.$("#games-empty").hidden);
  assertIncludes(app.$("#games-empty").textContent, "La ludothèque est vide, ajoutez un jeu");
});

test("adding a game posts the form then reloads the list", async () => {
  const app = await mountApp({ "GET /games": [catan], "POST /games": [201, { ...catan, id: "g3", title: "Dixit" }] });
  await waitFor(() => app.$$("#games-list .card").length === 1);
  app.click("+ Ajouter un jeu");
  const form = app.$("#game-form");
  form.elements.title.value = "  Dixit ";
  form.elements.minPlayers.value = "3";
  form.elements.maxPlayers.value = "6";
  form.elements.durationMinutes.value = "30";
  form.requestSubmit();
  await waitFor(() => app.calls.some((call) => call.method === "POST" && call.path === "/games"), "l'appel POST /games");
  assertEqual(app.calls.find((call) => call.method === "POST").body, {
    title: "Dixit",
    minPlayers: 3,
    maxPlayers: 6,
    durationMinutes: 30,
  });
  await waitFor(() => !app.$("#game-dialog").open, "la boîte se ferme");
});

test("a validation error is shown in French and the dialog stays open", async () => {
  const app = await mountApp({
    "GET /games": [],
    "POST /games": [400, { error: true, reason: "title is empty, durationMinutes is less than minimum of 1" }],
  });
  await waitFor(() => !app.$("#games-empty").hidden, "la page est chargée");
  app.click("+ Ajouter un jeu");
  app.$("#game-form").requestSubmit();
  await waitFor(() => !app.$("#game-dialog .form-error").hidden, "le message d'erreur");
  assertEqual(app.$("#game-dialog .form-error").textContent, "Le titre est obligatoire. La durée doit être d'au moins 1.");
  assertTrue(app.$("#game-dialog").open, "la boîte devrait rester ouverte");
});

// --- Update jeu

test("updating a game pre-fills the form, sends PUT and closes dialog", async () => {
  const app = await mountApp({
    "GET /games": [catan],
    "PUT /games/g1": [200, { ...catan, title: "Les Colons de Catane", maxPlayers: 6 }],
  });

  await waitFor(() => app.$$("#games-list .card").length === 1);
  app.click("Modifier", app.$("#games-list .card"));

  const form = app.$("#update-game-form");
  assertTrue(app.$("#update-game-dialog").open, "la boîte de modification devrait être ouverte");
  assertEqual(form.elements.title.value, "Catan");
  assertEqual(form.elements.minPlayers.value, "3");
  assertEqual(form.elements.maxPlayers.value, "4");
  assertEqual(form.elements.durationMinutes.value, "90");

  form.elements.title.value = "  Les Colons de Catane ";
  form.elements.maxPlayers.value = "6";
  form.requestSubmit();

  await waitFor(() => app.calls.some((call) => call.method === "PUT" && call.path === "/games/g1"), "l'appel PUT /games/g1");
  assertEqual(app.calls.find((call) => call.method === "PUT").body, {
    title: "Les Colons de Catane",
    minPlayers: 3,
    maxPlayers: 6,
    durationMinutes: 90,
  });
  await waitFor(() => !app.$("#update-game-dialog").open, "la boîte se ferme");
});

test("updating a game with invalid data shows error in French and keeps dialog open", async () => {
  const app = await mountApp({
    "GET /games": [catan],
    "PUT /games/g1": [400, { error: true, reason: "title is empty" }],
  });

  await waitFor(() => app.$$("#games-list .card").length === 1);
  app.click("Modifier", app.$("#games-list .card"));

  const form = app.$("#update-game-form");
  form.elements.title.value = "";
  form.requestSubmit();

  await waitFor(() => !app.$("#update-game-dialog .form-error").hidden, "le message d'erreur");
  assertEqual(app.$("#update-game-dialog .form-error").textContent, "Le titre est obligatoire.");
  assertTrue(app.$("#update-game-dialog").open, "la boîte devrait rester ouverte");
});

// --- Filtre jeux

test("filtering games reloads the list with query parameters", async () => {
  const catan = { id: "g1", title: "Catan", minPlayers: 3, maxPlayers: 4, durationMinutes: 90, isAvailable: true };
  const query = "title=Catan&minPlayers=3";
  const app = await mountApp({
    "GET /games": [catan],
    [`GET /games?${query}`]: [catan],
    "GET /loans/overdue": [],
  });

  await waitFor(() => app.$$("#games-list .card").length === 1);
  app.$("#filter-games").click();

  const form = app.$("#filter-game-form");
  assertTrue(app.$("#filter-game-dialog").open, "la boîte de filtre devrait être ouverte");

  form.elements["filter-title"].value = "  Catan ";
  form.elements["filter-min-players"].value = "3";
  form.requestSubmit();

  await waitFor(() => !app.$("#filter-game-dialog").open, "la boîte de filtre se ferme");
  await waitFor(
    () => app.calls.some((call) => call.method === "GET" && call.path === "/games" && call.search !== ""),
    "l'appel GET /games filtré",
  );

  const filteredCall = app.calls.find((call) => call.method === "GET" && call.path === "/games" && call.search !== "");
  assertEqual(filteredCall.search, `?${query}`);
});

// --- Supprimer jeu

test("deleting a game asks confirmation, sends DELETE and closes dialog", async () => {
  const catan = { id: "g1", title: "Catan", minPlayers: 3, maxPlayers: 4, durationMinutes: 90, isAvailable: true };
  const app = await mountApp({
    "GET /games": [catan],
    "DELETE /games/g1": [204],
    "GET /loans/overdue": [],
  });

  await waitFor(() => app.$$("#games-list .card").length === 1);
  app.click("Supprimer", app.$("#games-list .card"));

  const dialog = app.$("#delete-game-dialog");
  assertTrue(dialog.open, "la boîte de suppression devrait être ouverte");
  assertEqual(app.$("#delete-game-dialog-title").textContent, "Supprimer « Catan »");

  app.$("#delete-game-form").requestSubmit();

  await waitFor(() => app.calls.some((call) => call.method === "DELETE" && call.path === "/games/g1"), "l'appel DELETE /games/g1");
  await waitFor(() => !dialog.open, "la boîte de suppression se ferme");
});

test("deleting a game that is on loan shows error and keeps dialog open", async () => {
  const catan = { id: "g1", title: "Catan", minPlayers: 3, maxPlayers: 4, durationMinutes: 90, isAvailable: true };
  const app = await mountApp({
    "GET /games": [catan],
    "DELETE /games/g1": [409, { error: true, reason: "Game is already on loan" }],
    "GET /loans/overdue": [],
  });

  await waitFor(() => app.$$("#games-list .card").length === 1);
  app.click("Supprimer", app.$("#games-list .card"));

  app.$("#delete-game-form").requestSubmit();

  await waitFor(() => !app.$("#delete-game-dialog .form-error").hidden, "le message d'erreur");
  assertEqual(app.$("#delete-game-dialog .form-error").textContent, "Ce jeu est déjà emprunté : il faut d'abord le rendre.");
  assertTrue(app.$("#delete-game-dialog").open, "la boîte devrait rester ouverte");
});

// --- Emprunts

test("borrowed games only show the Retourner button", async () => {
  const borrowedGame = { id: "g2", title: "Dixit", minPlayers: 3, maxPlayers: 6, durationMinutes: 30, isAvailable: false };
  const app = await mountApp({ "GET /games": [borrowedGame] });

  await waitFor(() => app.$$("#games-list .card").length === 1);
  const card = app.$("#games-list .card");
  const buttons = [...card.querySelectorAll("button")].map((b) => b.textContent.trim());

  assertEqual(buttons, ["Retourner"]);
  assertIncludes(card.textContent, "Emprunté");
});

test("borrowing a game sends the game and the chosen member", async () => {
  const app = await mountApp({
    "GET /games": [catan],
    "GET /members": [camille],
    "POST /loans": [201, { id: "l1", gameID: "g1", memberID: "m1", borrowedAt: new Date().toISOString(), dueAt: new Date().toISOString() }],
  });
  await waitFor(() => app.$$("#games-list .card").length === 1);
  app.click("Emprunter", cardOf(app, "Catan"));
  await waitFor(() => app.$("#borrow-dialog").open, "la boîte d'emprunt");
  app.$("#borrow-form").requestSubmit();
  await waitFor(() => app.calls.some((call) => call.method === "POST" && call.path === "/loans"), "l'appel POST /loans");
  assertEqual(app.calls.find((call) => call.path === "/loans").body, { gameID: "g1", memberID: "m1" });
  await waitFor(() => app.$("#toasts").textContent.includes("emprunté"), "le message de confirmation");
});

test("borrowing without any member explains that one must be added first", async () => {
  const app = await mountApp({ "GET /games": [catan], "GET /members": [] });
  await waitFor(() => app.$$("#games-list .card").length === 1);
  app.click("Emprunter", cardOf(app, "Catan"));
  await waitFor(() => app.$("#toasts").textContent.includes("Ajoutez d'abord"), "le message d'aide");
  assertTrue(!app.$("#borrow-dialog").open, "la boîte d'emprunt ne doit pas s'ouvrir");
});

// --- Adhérent·es

test("members tab lists the members", async () => {
  const app = await mountApp({ "GET /members": [camille] }, { hash: "#members" });
  await waitFor(() => app.$$("#members-list .row").length === 1);
  assertIncludes(app.$("#members-list .row").textContent, "Camille");
  assertIncludes(app.$("#members-list .row").textContent, "camille@example.com");
});

test("with no member, a message invites to add one", async () => {
  const app = await mountApp({ "GET /members": [] }, { hash: "#members" });
  await waitFor(() => !app.$("#members-empty").hidden);
  assertIncludes(app.$("#members-empty").textContent, "Aucun adhérent·e pour le moment");
});

test("adding a member posts the form", async () => {
  const app = await mountApp({ "GET /members": [], "POST /members": [201, camille] }, { hash: "#members" });
  await waitFor(() => !app.$("#members-empty").hidden);
  app.click("Ajouter un·e adhérent·e");
  const form = app.$("#member-form");
  form.elements.name.value = " Camille ";
  form.elements.email.value = "camille@example.com";
  form.requestSubmit();
  await waitFor(() => app.calls.some((call) => call.method === "POST" && call.path === "/members"), "l'appel POST /members");
  assertEqual(app.calls.find((call) => call.method === "POST").body, { name: "Camille", email: "camille@example.com" });
});

test("an email already in use is shown in French", async () => {
  const app = await mountApp(
    { "GET /members": [], "POST /members": [409, { error: true, reason: "A member with this email already exists" }] },
    { hash: "#members" },
  );
  await waitFor(() => !app.$("#members-empty").hidden);
  app.click("Ajouter un·e adhérent·e");
  app.$("#member-form").requestSubmit();
  await waitFor(() => !app.$("#member-dialog .form-error").hidden, "le message d'erreur");
  assertIncludes(app.$("#member-dialog .form-error").textContent, "utilise déjà cette adresse e-mail");
});

// --- Modifier adhérent·e

test("updating a member pre-fills the form, sends PUT and closes dialog", async () => {
  const app = await mountApp(
    {
      "GET /members": [camille],
      "PUT /members/m1": [200, { ...camille, name: "Camille Dupont" }],
    },
    { hash: "#members" },
  );

  await waitFor(() => app.$$("#members-list .row").length === 1);
  app.click("Modifier", app.$("#members-list .row"));

  const form = app.$("#update-member-form");
  assertTrue(app.$("#update-member-dialog").open, "la boîte de modification devrait être ouverte");
  assertEqual(form.elements["update-name"].value, "Camille");
  assertEqual(form.elements["update-email"].value, "camille@example.com");

  form.elements["update-name"].value = "  Camille Dupont ";
  form.requestSubmit();

  await waitFor(() => app.calls.some((call) => call.method === "PUT" && call.path === "/members/m1"), "l'appel PUT /members/m1");
  assertEqual(app.calls.find((call) => call.method === "PUT").body, {
    name: "Camille Dupont",
    email: "camille@example.com",
  });
  await waitFor(() => !app.$("#update-member-dialog").open, "la boîte se ferme");
});

test("updating a member with an email already used shows error in French and keeps dialog open", async () => {
  const app = await mountApp(
    {
      "GET /members": [camille],
      "PUT /members/m1": [409, { error: true, reason: "A member with this email already exists" }],
    },
    { hash: "#members" },
  );

  await waitFor(() => app.$$("#members-list .row").length === 1);
  app.click("Modifier", app.$("#members-list .row"));

  app.$("#update-member-form").requestSubmit();

  await waitFor(() => !app.$("#update-member-dialog .form-error").hidden, "le message d'erreur");
  assertIncludes(app.$("#update-member-dialog .form-error").textContent, "utilise déjà cette adresse e-mail");
  assertTrue(app.$("#update-member-dialog").open, "la boîte devrait rester ouverte");
});

// --- Supprimer adhérent·e

test("deleting a member asks confirmation, sends DELETE and closes dialog", async () => {
  const app = await mountApp(
    {
      "GET /members": [camille],
      "DELETE /members/m1": [204],
    },
    { hash: "#members" },
  );

  await waitFor(() => app.$$("#members-list .row").length === 1);
  app.click("Supprimer", app.$("#members-list .row"));

  const dialog = app.$("#delete-member-dialog");
  assertTrue(dialog.open, "la boîte de suppression devrait être ouverte");
  assertEqual(app.$("#delete-member-dialog-title").textContent, "Supprimer « Camille »");

  app.$("#delete-member-form").requestSubmit();

  await waitFor(() => app.calls.some((call) => call.method === "DELETE" && call.path === "/members/m1"), "l'appel DELETE /members/m1");
  await waitFor(() => !dialog.open, "la boîte de suppression se ferme");
});

test("deleting a member with a loan history shows error and keeps dialog open", async () => {
  const app = await mountApp(
    {
      "GET /members": [camille],
      "DELETE /members/m1": [409, { error: true, reason: "A member with loans cannot be deleted" }],
    },
    { hash: "#members" },
  );

  await waitFor(() => app.$$("#members-list .row").length === 1);
  app.click("Supprimer", app.$("#members-list .row"));

  app.$("#delete-member-form").requestSubmit();

  await waitFor(() => !app.$("#delete-member-dialog .form-error").hidden, "le message d'erreur");
  assertEqual(
    app.$("#delete-member-dialog .form-error").textContent,
    "Suppression impossible : cet·te adhérent·e a un historique d'emprunts, conservé même quand tout est rendu.",
  );
  assertTrue(app.$("#delete-member-dialog").open, "la boîte devrait rester ouverte");
});

// --- Emprunts d'un adhérent·e

test("a member's loans panel shows returned, ongoing and overdue loans", async () => {
  const now = Date.now();
  const returned = {
    id: "l1",
    gameID: "g1",
    memberID: "m1",
    borrowedAt: new Date(now - 20 * 86_400_000).toISOString(),
    dueAt: new Date(now - 6 * 86_400_000).toISOString(),
    returnedAt: new Date(now - 10 * 86_400_000).toISOString(),
  };
  const ongoing = {
    id: "l2",
    gameID: "g2",
    memberID: "m1",
    borrowedAt: new Date(now - 2 * 86_400_000).toISOString(),
    dueAt: new Date(now + 12 * 86_400_000).toISOString(),
    returnedAt: null,
  };
  const overdue = {
    id: "l3",
    gameID: "g1",
    memberID: "m1",
    borrowedAt: new Date(now - 30 * 86_400_000).toISOString(),
    dueAt: new Date(now - 16 * 86_400_000).toISOString(),
    returnedAt: null,
  };

  const app = await mountApp(
    {
      "GET /members": [camille],
      "GET /members/m1/loans": [returned, ongoing, overdue],
      "GET /games/g1": catan,
      "GET /games/g2": dixit,
    },
    { hash: "#members" },
  );

  await waitFor(() => app.$$("#members-list .row").length === 1);
  app.click("Emprunts", app.$("#members-list .row"));

  await waitFor(() => app.$$("#member-borrows-tbody tr").length === 3, "les trois emprunts");
  const rows = app.$$("#member-borrows-tbody tr").map((row) => row.textContent);

  assertTrue(
    rows.some((text) => text.includes("Catan") && text.includes(formatDate(returned.returnedAt))),
    "l'emprunt rendu affiche sa date de retour",
  );
  assertTrue(rows.some((text) => text.includes("Dixit") && text.includes("En cours")), "l'emprunt en cours est signalé");
  assertTrue(rows.some((text) => text.includes("Catan") && text.includes("En retard")), "l'emprunt en retard est signalé");
});

test("a member's loans panel shows a message when there are no loans", async () => {
  const app = await mountApp(
    {
      "GET /members": [camille],
      "GET /members/m1/loans": [],
    },
    { hash: "#members" },
  );

  await waitFor(() => app.$$("#members-list .row").length === 1);
  app.click("Emprunts", app.$("#members-list .row"));

  await waitFor(() => app.$("#member-borrows-dialog").open, "la boîte des emprunts devrait être ouverte");
  await waitFor(() => app.$("#member-borrows-tbody").textContent.includes("Aucun emprunt."), "le message de liste vide");
});
