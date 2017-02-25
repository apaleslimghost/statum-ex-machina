const turn = {
	acceptMessage: [
		({turn, player}) => turn.player === player
	],


	actionPhase: {
		@acceptMessage(
			({player}, {card}) => player.hand.has(card),
			({turn}) => turn.remainingActions > 0
		)
		playCard({turn, player, card}) {

		}
	},

	buyPhase: {
		@acceptMessage(
			({supply}, {cardType}) => supply.has(cardType),
			({turn}, {cardType}) => turn.currentTreasure() >= cardType.cost
		)
		buyCard({turn, supply, player}, {cardType}) {

		}
	},

	@decorator
	shorthand
};

class StateMachine {
	constructor(stateMap) {
		this.stateMap = stateMap;
	}

	transition(state, args) {

	}

	message(message) {

	}
}