@testable import App
import XCTVapor

final class MemberTests: XCTestCase {
    func testCreateMemberReturnsCreated() async throws {
        try await withApp { app in
            try await app.test(.POST, "members", beforeRequest: { req in
                try req.content.encode(CreateMemberDTO(name: "Camille", email: "camille@example.com"))
            }, afterResponse: { res async throws in
                XCTAssertEqual(res.status, .created)
                XCTAssertEqual(try res.content.decode(MemberDTO.self).name, "Camille")
            })
        }
    }

    func testCreateMemberWithInvalidEmailIsRejected() async throws {
        try await withApp { app in
            try await app.test(.POST, "members", beforeRequest: { req in
                try req.content.encode(CreateMemberDTO(name: "Camille", email: "not-an-email"))
            }, afterResponse: { res async throws in
                XCTAssertEqual(res.status, .badRequest)
            })
        }
    }

    func testCreateMemberWithDuplicateEmailReturnsConflict() async throws {
        try await withApp { app in
            _ = try await createMember(app)

            try await app.test(.POST, "members", beforeRequest: { req in
                try req.content.encode(CreateMemberDTO(name: "Autre", email: "camille@example.com"))
            }, afterResponse: { res async throws in
                XCTAssertEqual(res.status, .conflict)
            })
        }
    }

    func testShowUnknownMemberReturnsNotFound() async throws {
        try await withApp { app in
            try await app.test(.GET, "members/\(UUID())", afterResponse: { res async throws in
                XCTAssertEqual(res.status, .notFound)
            })
        }
    }
    
    func testMemberUpdate() async throws {
        try await withApp { app in
            let memberToUpdate = try await createMember(app)
            let newMember = createUpdateMemberDTO()
            let memberToUpdateId = try XCTUnwrap(memberToUpdate.id)
            try await app.test(
                .PUT, "members/\(memberToUpdateId)",
                beforeRequest: {
                    req in try req.content.encode(newMember)
                },
                afterResponse: {
                    res async throws in
                    XCTAssertEqual(res.status, .ok)
                }
            )
            
            try await app.test(.GET, "members/\(memberToUpdateId)", afterResponse: { res async throws in
                XCTAssertEqual(res.status, .ok)
                let member = try res.content.decode(MemberDTO.self)
                XCTAssertEqual(member.name, newMember.name)
                XCTAssertEqual(member.email, newMember.email)
            })
        }
    }
    
    func testMemberDeletion() async throws {
        try await withApp { app in
            let member = try await createMember(app)
            let id = try XCTUnwrap(member.id)

            try await app.test(.DELETE, "members/\(id)", afterResponse: { res async throws in
                XCTAssertEqual(res.status, .noContent)
            })
            
            try await app.test(.GET, "members/\(id)", afterResponse: { res async throws in
                XCTAssertEqual(res.status, .notFound)
            })
        }
    }
    
    func testMemberDeletionWithActiveLoan() async throws {
        try await withApp { app in
            let member = try await createMember(app)
            let game = try await createGame(app)
            let id = try XCTUnwrap(member.id)
            try await borrow(app, gameID: try XCTUnwrap(game.id), memberID: id,
                             afterResponse: {
                res async throws in XCTAssertEqual(res.status, .created)
            }
            )
            try await app.test(.DELETE, "members/\(id)", afterResponse: { res async throws in
                XCTAssertEqual(res.status, .conflict)
            })
        }
    }
    

}
