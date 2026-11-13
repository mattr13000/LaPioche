import Fluent

struct CreateLoan: AsyncMigration {
    func prepare(on database: any Database) async throws {
        try await database.schema("loans")
            .id()
            .field("game_id", .uuid, .required, .references("games", "id"))
            .field("member_id", .uuid, .required, .references("members", "id"))
            .field("borrowed_at", .datetime, .required)
            .field("due_at", .datetime, .required)
            .field("returned_at", .datetime)
            .create()
    }

    func revert(on database: any Database) async throws {
        try await database.schema("loans").delete()
    }
}
