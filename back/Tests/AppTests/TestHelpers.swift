@testable import App
import XCTVapor

func withApp(_ test: (Application) async throws -> Void) async throws {
    let app = try await Application.make(.testing)
    do {
        try await configure(app)
        try await test(app)
    } catch {
        try? await app.asyncShutdown()
        throw error
    }
    try await app.asyncShutdown()
}

func createGame(
    _ app: Application,
    title: String = "Catan",
    minPlayers: Int = 3,
    maxPlayers: Int = Int.random(in: 4...10),
    durationMinutes: Int = Int.random(in: 30...120)
) async throws -> GameDTO {
    var game: GameDTO?
    try await app.test(.POST, "games", beforeRequest: { req in
        try req.content.encode(CreateGameDTO(
            title: title,
            minPlayers: minPlayers,
            maxPlayers: maxPlayers,
            durationMinutes: durationMinutes
        ))
    }, afterResponse: { res async throws in
        game = try res.content.decode(GameDTO.self)
    })
    return try XCTUnwrap(game)
}

func createUpdateGameDTO(
    title: String = "Catan",
    minPlayers: Int = 3,
    maxPlayers: Int = Int.random(in: 4...10),
    durationMinutes: Int = Int.random(in: 30...120),
) -> UpdateGameDTO {
    return UpdateGameDTO(
        title: title,
        minPlayers: minPlayers,
        maxPlayers: maxPlayers,
        durationMinutes: durationMinutes)
}

func createMember(
    _ app: Application,
    name: String = "Camille",
    email: String = "camille@example.com"
) async throws -> MemberDTO {
    var member: MemberDTO?
    try await app.test(.POST, "members", beforeRequest: { req in
        try req.content.encode(CreateMemberDTO(name: name, email: email))
    }, afterResponse: { res async throws in
        member = try res.content.decode(MemberDTO.self)
    })
    return try XCTUnwrap(member)
}

func createUpdateMemberDTO(
    name: String = "Didier",
    email: String = "didier@gmail.com"
) -> UpdateMemberDTO {
    return UpdateMemberDTO(
        name: name,
        email: email
    )
}

// The API cannot create a loan that is already late, so tests insert it directly.
func insertLoan(
    _ app: Application,
    gameID: UUID,
    memberID: UUID,
    borrowedAt: Date,
    dueAt: Date,
    returnedAt: Date? = nil
) async throws {
    let loan = Loan(gameID: gameID, memberID: memberID, borrowedAt: borrowedAt, dueAt: dueAt)
    loan.returnedAt = returnedAt
    try await loan.save(on: app.db)
}

func borrow(
    _ app: Application,
    gameID: UUID,
    memberID: UUID,
    afterResponse: (XCTHTTPResponse) async throws -> Void
) async throws {
    try await app.test(.POST, "loans", beforeRequest: { req in
        try req.content.encode(CreateLoanDTO(gameID: gameID, memberID: memberID))
    }, afterResponse: afterResponse)
}
