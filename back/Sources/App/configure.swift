import Fluent
import FluentSQLiteDriver
import Vapor

func configure(_ app: Application) async throws {
    app.http.server.configuration.port = 8081

    let cors = CORSMiddleware(configuration: .init(
        allowedOrigin: .all,
        allowedMethods: [.GET, .POST, .PUT, .DELETE, .OPTIONS],
        allowedHeaders: [.accept, .contentType, .origin]
    ))
    // CORS must wrap the error middleware so that error responses carry its headers too.
    app.middleware = .init()
    app.middleware.use(cors)
    app.middleware.use(ErrorMiddleware.default(environment: app.environment))
    app.middleware.use(FileMiddleware(publicDirectory: app.directory.publicDirectory, defaultFile: "index.html"))

    if app.environment == .testing {
        app.databases.use(.sqlite(.memory), as: .sqlite)
    } else {
        app.databases.use(.sqlite(.file("db.sqlite")), as: .sqlite)
    }

    let encoder = JSONEncoder()
    encoder.dateEncodingStrategy = .iso8601
    let decoder = JSONDecoder()
    decoder.dateDecodingStrategy = .iso8601
    ContentConfiguration.global.use(encoder: encoder, for: .json)
    ContentConfiguration.global.use(decoder: decoder, for: .json)

    app.migrations.add(CreateGame())
    app.migrations.add(CreateMember())
    app.migrations.add(CreateLoan())
    try await app.autoMigrate()

    app.asyncCommands.use(SeedCommand(), as: "seed")

    try routes(app)
}
