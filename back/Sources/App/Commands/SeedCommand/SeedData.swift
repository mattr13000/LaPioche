//
//  UpdateMemberDTO.swift
//  LaPioche
//
//  Created by Apprenant 77 on 14/11/2026.
//

struct GameSeed {
    let title: String
    let minPlayers: Int
    let maxPlayers: Int
    let durationMinutes: Int
}

struct MemberSeed {
    let name: String
    let email: String
}

struct LoanSeed {
    let gameIndex: Int
    let memberIndex: Int
}

enum SeedData {
    static let games: [GameSeed] = [
        GameSeed(title: "Catan", minPlayers: 3, maxPlayers: 4, durationMinutes: 90),
        GameSeed(title: "7 Wonders", minPlayers: 3, maxPlayers: 7, durationMinutes: 30),
        GameSeed(title: "Carcassonne", minPlayers: 2, maxPlayers: 5, durationMinutes: 45),
        GameSeed(title: "Pandemic", minPlayers: 2, maxPlayers: 4, durationMinutes: 45),
        GameSeed(title: "Azul", minPlayers: 2, maxPlayers: 4, durationMinutes: 45),
        GameSeed(title: "Dixit", minPlayers: 3, maxPlayers: 6, durationMinutes: 30),
        GameSeed(title: "Skull", minPlayers: 3, maxPlayers: 6, durationMinutes: 20),
        GameSeed(title: "Codenames", minPlayers: 2, maxPlayers: 8, durationMinutes: 15),
        GameSeed(title: "Splendor", minPlayers: 2, maxPlayers: 4, durationMinutes: 30),
        GameSeed(title: "Ticket to Ride", minPlayers: 2, maxPlayers: 5, durationMinutes: 60),
        GameSeed(title: "Terraforming Mars", minPlayers: 1, maxPlayers: 5, durationMinutes: 120),
        GameSeed(title: "Wingspan", minPlayers: 1, maxPlayers: 5, durationMinutes: 70),
        GameSeed(title: "Hanabi", minPlayers: 2, maxPlayers: 5, durationMinutes: 25),
        GameSeed(title: "Love Letter", minPlayers: 2, maxPlayers: 4, durationMinutes: 20),
        GameSeed(title: "Coup", minPlayers: 2, maxPlayers: 6, durationMinutes: 15),
        GameSeed(title: "King of Tokyo", minPlayers: 2, maxPlayers: 6, durationMinutes: 30),
        GameSeed(title: "Takenoko", minPlayers: 2, maxPlayers: 4, durationMinutes: 45),
        GameSeed(title: "Cluedo", minPlayers: 3, maxPlayers: 6, durationMinutes: 45),
        GameSeed(title: "Monopoly", minPlayers: 2, maxPlayers: 8, durationMinutes: 90),
        GameSeed(title: "Uno", minPlayers: 2, maxPlayers: 10, durationMinutes: 30),
    ]

    static let members: [MemberSeed] = [
        MemberSeed(name: "Alice Martin", email: "alice.martin@example.com"),
        MemberSeed(name: "Baptiste Durand", email: "baptiste.durand@example.com"),
        MemberSeed(name: "Camille Petit", email: "camille.petit@example.com"),
        MemberSeed(name: "David Leroy", email: "david.leroy@example.com"),
        MemberSeed(name: "Emma Moreau", email: "emma.moreau@example.com"),
        MemberSeed(name: "Fabien Girard", email: "fabien.girard@example.com"),
        MemberSeed(name: "Gaëlle Simon", email: "gaelle.simon@example.com"),
        MemberSeed(name: "Hugo Bernard", email: "hugo.bernard@example.com"),
        MemberSeed(name: "Inès Dubois", email: "ines.dubois@example.com"),
        MemberSeed(name: "Julien Rousseau", email: "julien.rousseau@example.com"),
    ]

    static let loans: [LoanSeed] = [
        LoanSeed(gameIndex: 0, memberIndex: 0),
        LoanSeed(gameIndex: 1, memberIndex: 0),
        LoanSeed(gameIndex: 2, memberIndex: 0),
        LoanSeed(gameIndex: 3, memberIndex: 1),
        LoanSeed(gameIndex: 4, memberIndex: 1),
        LoanSeed(gameIndex: 5, memberIndex: 2),
        LoanSeed(gameIndex: 6, memberIndex: 2),
        LoanSeed(gameIndex: 7, memberIndex: 2),
        LoanSeed(gameIndex: 8, memberIndex: 3),
        LoanSeed(gameIndex: 9, memberIndex: 4),
        LoanSeed(gameIndex: 10, memberIndex: 4),
        LoanSeed(gameIndex: 11, memberIndex: 5),
        LoanSeed(gameIndex: 12, memberIndex: 5),
        LoanSeed(gameIndex: 13, memberIndex: 6),
        LoanSeed(gameIndex: 14, memberIndex: 6),
    ]
}
