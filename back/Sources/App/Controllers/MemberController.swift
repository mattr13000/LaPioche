import Fluent
import Vapor

struct MemberController: RouteCollection {
    func boot(routes: any RoutesBuilder) throws {
        let members = routes.grouped("members")
        members.get(use: index)
        members.post(use: create)
        members.get(":memberID", use: show)
        members.put(":memberID", use: update)
        members.delete(":memberID", use: delete)
    }

    @Sendable
    func index(req: Request) async throws -> [MemberDTO] {
        try await Member.query(on: req.db).all().map { $0.toDTO() }
    }

    @Sendable
    func create(req: Request) async throws -> Response {
        try CreateMemberDTO.validate(content: req)
        let dto = try req.content.decode(CreateMemberDTO.self)

        let emailTaken = try await Member.query(on: req.db)
            .filter(\.$email == dto.email)
            .count() > 0
        guard !emailTaken else {
            throw Abort(.conflict, reason: "A member with this email already exists")
        }

        let member = dto.toModel()
        try await member.save(on: req.db)
        return try await member.toDTO().encodeResponse(status: .created, for: req)
    }

    @Sendable
    func show(req: Request) async throws -> MemberDTO {
        guard let memberID = req.parameters.get("memberID", as: UUID.self) else {
            throw Abort(.badRequest, reason: "Invalid member id")
        }
        guard let member = try await Member.find(memberID, on: req.db) else {
            throw Abort(.notFound, reason: "Member not found")
        }
        return member.toDTO()
    }
    
    @Sendable
    func update(req: Request) async throws -> Response {
        guard let memberID = req.parameters.get("memberID", as: UUID.self) else {
            throw Abort(.badRequest, reason: "Invalid game id")
        }
        guard let member = try await Member.find(memberID, on: req.db)
        else {
            throw Abort(.notFound, reason: "Member not found")
        }
        
        let newMember = try req.content.decode(UpdateMemberDTO.self)
        
        let emailTaken = try await Member.query(on: req.db)
            .filter(\.$email == newMember.email)
            .count() > 0
        guard !emailTaken else {
            throw Abort(.conflict, reason: "A member with this email already exists")
        }
        
        member.name = newMember.name
        member.email = newMember.email
        
        try await member.update(on: req.db)
        return try await member.toDTO().encodeResponse(status: .ok, for: req)
    }
    
    @Sendable
    func delete(req: Request) async throws -> HTTPStatus {
        guard let memberID = req.parameters.get("memberID", as: UUID.self) else {
            throw Abort(.badRequest, reason: "Invalid member id")
        }
        guard let member = try await Member.find(memberID, on: req.db)
        else {
            throw Abort(.notFound, reason: "Member not found")
        }
        
        let loanCount = try await Loan.query(on: req.db)
            .filter(\.$member.$id == member.requireID())
            .count()

        guard loanCount == 0 else {
            throw Abort(.conflict, reason: "A member with loans cannot be deleted")
        }
        
        try await member.delete(on: req.db)
        return .noContent
    }
}
