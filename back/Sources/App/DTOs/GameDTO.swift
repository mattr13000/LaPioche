import Vapor

struct GameDTO: Content {
    let id: UUID?
    let title: String
    let minPlayers: Int
    let maxPlayers: Int
    let durationMinutes: Int
    let isAvailable: Bool
    let currentLoanID: UUID?
}

extension Game {
    func toDTO() -> GameDTO {
        GameDTO(
            id: id,
            title: title,
            minPlayers: minPlayers,
            maxPlayers: maxPlayers,
            durationMinutes: durationMinutes,
            isAvailable: isAvailable,
            currentLoanID: currentLoanID
        )
    }
}
