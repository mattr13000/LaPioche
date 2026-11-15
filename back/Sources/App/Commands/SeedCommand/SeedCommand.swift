//
//  UpdateMemberDTO.swift
//  LaPioche
//
//  Created by Apprenant 77 on 14/11/2026.
//

import Fluent
import Vapor

struct SeedCommand: AsyncCommand {
    struct Signature: CommandSignature {}

    var help: String { "Wipes the database and fills it with sample games, members and loans." }

    func run(using context: CommandContext, signature: Signature) async throws {
        let db = context.application.db

        try await Loan.query(on: db).delete()
        try await Game.query(on: db).delete()
        try await Member.query(on: db).delete()

        var games: [Game] = []
        for seed in SeedData.games {
            let game = Game(title: seed.title, minPlayers: seed.minPlayers, maxPlayers: seed.maxPlayers, durationMinutes: seed.durationMinutes)
            try await game.create(on: db)
            games.append(game)
        }

        var members: [Member] = []
        for seed in SeedData.members {
            let member = Member(name: seed.name, email: seed.email)
            try await member.create(on: db)
            members.append(member)
        }

        let now = Date()
        for (offset, loanSeed) in SeedData.loans.enumerated() {
            let game = games[loanSeed.gameIndex]
            let member = members[loanSeed.memberIndex]

            let borrowedAt: Date
            var returnedAt: Date?
            switch offset % 3 {
            case 0:
                borrowedAt = now.addingTimeInterval(-20 * 86_400)
            case 1:
                borrowedAt = now.addingTimeInterval(-5 * 86_400)
            default:
                borrowedAt = now.addingTimeInterval(-30 * 86_400)
                returnedAt = now.addingTimeInterval(-20 * 86_400)
            }

            let loan = try Loan(
                gameID: game.requireID(),
                memberID: member.requireID(),
                borrowedAt: borrowedAt,
                dueAt: Loan.dueDate(from: borrowedAt)
            )
            loan.returnedAt = returnedAt
            try await loan.create(on: db)
        }

        context.console.print("Seeded \(games.count) games, \(members.count) members, \(SeedData.loans.count) loans.")
    }
}
