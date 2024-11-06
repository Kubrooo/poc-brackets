/**
 * @typedef {Object} Participant
 * @property {String} name
 * 
 * @param {Number} count
 * @param {Boolean} unamed
 * @returns {Participant[]}
 */
function generateParticipants(count, unamed) {
    const participants = []

    for (let i = 1; i <= count; i++) {
        participants.push({
            name: unamed === false ? `Participant ${i}` : '...'
        })
    }

    return participants
}

/**
 * @typedef {Object} Round
 * @property {Match[]} matches
 * 
 * @param {number} totalParties
 * @returns {Round[]}
 */
function generateRounds(totalParties) {
    const rounds = []
    let nextRounds = totalParties
    let round = 0

    while (nextRounds > 2) {
        const participants = generateParticipants(nextRounds, round > 0)

        rounds.push({
            id: ++round,
            count: nextRounds,
            matches: generateMatches(participants, round, (num) => {
                return num + rounds.reduce((sum, r) => r.matches.length + sum, 0)
            }),
        })

        nextRounds = Math.ceil(nextRounds / 2)
    }

    // console.log(rounds)
    return rounds
}

/**
 * @typedef {Object} Match
 * @property {Number} id
 * @property {Number} round
 * @property {'blue'|'red'} side
 * @property {Participant[]} parties
 * 
 * @param {Participant[]} participants
 * @param {Number} round
 * @param {(num: Number) => Number} cb
 * @returns {Match[]}
 */
function generateMatches(participants, round, cb) {
    let parties = []
    let matchId = 1

    /**
     * @type {Match[]} matches
     */
    const matches = participants.reduce((matches, party, i) => {
        const id = Number(i) + 1
        const isEven = id % 2 == 0

        parties.push({
            side: isEven ? 'red' : 'blue',
            ...party
        })

        if (isEven) {
            matches.push({
                id: cb(matchId),
                round,
                parties
            })
            
            parties = []
            matchId++

            return matches
        }

        return matches
    }, [])

    let chunks = createChunks(matches)

    for (const chunk of chunks) {
        for (const [side, cMatches] of Object.entries(chunk)) {
            cMatches.forEach((match, c) => {
                const i = matches.findIndex((m) => m.id === match.id)

                matches[i].side = side
                
                if (cMatches.length > 1 && c > 0) {
                    matches[i].round = matches[i].round * cMatches.length
                }
            })
        }
    }

    console.log(matches)
    return matches
}

/**
 * @param {Match[]} matches 
 */
function createChunks(matches) {
    let side = matches.length
    let chunks = []

    while (side > 2) {
        side = side / 2

        if (chunks.length === 0) {
            chunks.push(createMatchSides(matches, side))
            
            continue
        }
        
        const tmpChunks = []
        for (const i in chunks) {
            const chunk = chunks[i]

            tmpChunks.push(
                createMatchSides(chunk.blue, side),
                createMatchSides(chunk.red, side)
            )
        }

        chunks = []
        chunks.push(...tmpChunks)
    }

    return chunks
}

/**
 * @typedef {Object} Side
 * @property {Match[]} blue
 * @property {Match[]} red
 * 
 * @param {Match[]} matches 
 * @param {Number} slice 
 * @returns {Side}
 */
function createMatchSides(matches, slice) {
    return {
        blue: matches.slice(0, slice),
        red: matches.slice(slice),
    }
}

/**
 * @param {Number} totalParties
 */
export function init(totalParties) {
    const rounds = generateRounds(totalParties)
    const matchGap = 30
    
    const $chart = document.getElementById('chart')

    $chart.style.setProperty('--participants', `${totalParties}`)

    for (const roundId in rounds) {
        const round = rounds[roundId]

        const $section = document.createElement('section')
        const $title = document.createElement('h3')
        const $matches = document.createElement('div')

        $section.id = `round-${roundId}`
        $title.innerText = `Round ${roundId}`
        $section.classList.add('rounds')
        $matches.classList.add('matches')
        $matches.style.setProperty('--gap', `${matchGap}px`)

        $section.append($title)

        for (const match of round.matches) {
            const $match = document.createElement('div')
            const $matchTitle = document.createElement('h4')

            $match.setAttribute('data-match', match.id)
            $match.setAttribute('data-round', roundId)
            $match.setAttribute('data-side', match.side)
            $match.style.setProperty('--next-round', match.round)
            $match.classList.add('match')

            if (roundId > 0) {
                $match.classList.add('has-prev')
                
                if (roundId == (rounds.length - 1)) {
                    $match.classList.add('final-round')
                }
            }

            $matchTitle.innerText = match.id

            $match.append($matchTitle)

            for (const party of match.parties) {
                const $participant = document.createElement('div')
                const $name = document.createElement('label')
                const $check = document.createElement('input')

                $check.type = 'checkbox'
                $check.name = $check.id = [
                    roundId,
                    party.name.toLowerCase().replace(' ', '-')
                ].join('-')

                $name.setAttribute('for', $check.id)
                $name.innerText = party.name
                $participant.setAttribute('data-side', party.side)
                $participant.append($name, $check)

                $match.append($participant)
            }

            $matches.append($match)
        }
        
        $section.append($matches)
        $chart.append($section)
    }

    const $genMatches = document.getElementsByClassName('match')
    
    for (const $genMatch of $genMatches) {
        let matchRound = Number($genMatch.getAttribute('data-round'))
        
        if (matchRound > 1) {
            matchRound *= matchRound
            matchRound -= 1
        }

        const boxHeight = $genMatch.getBoundingClientRect().height
        const gap = (matchGap * matchRound) - matchRound
        const boxMargin = ((boxHeight * matchRound) + gap) / 2
        
        $genMatch.style.setProperty('--margin', `${boxMargin}px`)
        
        // console.log(matchRound)
    }
}