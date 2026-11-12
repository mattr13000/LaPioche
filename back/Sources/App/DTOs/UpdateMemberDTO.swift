//
//  UpdateMemberDTO.swift
//  LaPioche
//
//  Created by Apprenant 77 on 12/11/2026.
//

import Vapor

struct UpdateMemberDTO: Content, Validatable {
    let name: String
    let email: String
    
    static func validations(_ validations: inout Validations) {
        validations.add("name", as: String.self, is: !.empty)
        validations.add("email", as: String.self, is: .email)
    }
}
