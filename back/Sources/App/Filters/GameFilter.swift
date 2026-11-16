//
//  GameFilter.swift
//  LaPioche
//
//  Created by Apprenant 77 on 16/11/2026.
//

import Vapor

struct GameFilter: Content, Validatable {
    var title: String?
    var minPlayers: Int?
    var maxPlayers: Int?
    var maxDuration: Int?
    var isAvailable: Bool?
    
    static func validations(_ validations: inout Validations) {
        validations.add("minPlayers", as: Int.self, is: .range(1...), required: false)
        validations.add("maxPlayers", as: Int.self, is: .range(1...), required: false)
        validations.add("durationMinutes", as: Int.self, is: .range(1...), required: false)
    }
}
