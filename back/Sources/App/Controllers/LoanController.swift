import Fluent
import Vapor

struct LoanController: RouteCollection {
    func boot(routes: any RoutesBuilder) throws {
        let loans = routes.grouped("loans")
        loans.get("overdue", use: getOverdueLoans)
        loans.post(use: create)
        loans.post(":loanID", "return", use: update)
    }
    
    @Sendable
    func getOverdueLoans(req: Request) async throws -> Response {
        let loans = try await Loan.query(on: req.db)
            .filter(\.$returnedAt == nil)
            .filter(\.$dueAt < Date())
            .all()
        return try await loans.map { $0.toDTO() }.encodeResponse(status: .ok, for: req)
    }

    @Sendable
    func create(req: Request) async throws -> Response {
        let dto = try req.content.decode(CreateLoanDTO.self)

        guard let game = try await Game.query(on: req.db)
            .filter(\.$id == dto.gameID)
            .with(\.$loans)
            .first()
        else {
            throw Abort(.notFound, reason: "Game not found")
        }
 
        guard let member = try await Member.find(dto.memberID, on: req.db) else {
            throw Abort(.notFound, reason: "Member not found")
        }
        
        guard game.isAvailable else {
            throw Abort(.conflict, reason: "Game is already on loan")
        }
        
        let now = Date()
        let loan = Loan(
            gameID: try game.requireID(),
            memberID: try member.requireID(),
            borrowedAt: now,
            dueAt: try Loan.dueDate(from: now)
        )
        try await loan.save(on: req.db)
        return try await loan.toDTO().encodeResponse(status: .created, for: req)
    }
    
    @Sendable
    func update(req: Request) async throws -> HTTPStatus {
        guard let loanID = req.parameters.get("loanID", as: UUID.self) else {
            throw Abort(.badRequest, reason: "Invalid loan id")
        }
        
        guard let loan = try await Loan.find(loanID, on: req.db)
        else {
            throw Abort(.notFound, reason: "Loan not found")
        }
        
        guard loan.returnedAt == nil else {
            throw Abort(.conflict, reason: "Loan is already returned")
        }
        
        loan.returnedAt = Date()
        try await loan.update(on: req.db)
        
        return .ok
    }
}
