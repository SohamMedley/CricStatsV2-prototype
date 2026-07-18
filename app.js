// ==========================================
// CRICSTATS-V2 STANDALONE PROTOTYPE ENGINE STATE
// ==========================================

let rosterPool = [
    { id: "p-1", name: "Soham Dharap", role: "All-rounder", hand: "Right-handed" },
    { id: "p-2", name: "Rohan Sharma", role: "Batsman", hand: "Right-handed" },
    { id: "p-3", name: "Aman Verma", role: "Bowler", hand: "Left-handed" },
    { id: "p-4", name: "Kabir Mehta", role: "Wicketkeeper", hand: "Right-handed" },
    { id: "p-5", name: "Vikram Malhotra", role: "Batsman", hand: "Left-handed" },
    { id: "p-6", name: "Aditya Joshi", role: "Bowler", hand: "Right-handed" }
];

let matchState = {
    initialized: false,
    teamA: "Mumbai Titans",
    teamB: "Badlapur Warriors",
    maxOvers: 2,
    currentInnings: 1,
    eventLedger: [],
    
    // In-memory calculated parameters
    strikerId: "p-1",
    nonStrikerId: "p-2",
    currentBowlerId: "p-3",
    
    innings1: null,
    innings2: null
};

// Target tracking for crease switches
let placementTargetKey = "";

// ==========================================
// VIEW ROUTING CONTROLLER
// ==========================================
function switchView(viewId) {
    document.querySelectorAll('.spa-view').forEach(view => {
        view.classList.remove('active');
    });
    const target = document.getElementById(viewId);
    if (target) {
        target.classList.add('active');
    }
    
    // Trigger lifecycle hooks contextually
    if (viewId === 'view-roster') renderRosterView();
    if (viewId === 'view-setup') populateSetupDropdowns();
    if (viewId === 'view-scorecard') renderLiveConsoleUI();
    if (viewId === 'view-analytics') renderAnalyticsView();
}

function triggerToastNotification(msg, isError = false) {
    const banner = document.getElementById('feedbackToast');
    if (!banner) return;
    banner.innerText = msg;
    banner.style.background = isError ? 'rgba(255, 51, 75, 0.98)' : 'rgba(10, 84, 255, 0.98)';
    banner.style.boxShadow = isError ? '0 24px 48px rgba(255, 51, 75, 0.4)' : '0 24px 48px rgba(10, 84, 255, 0.5)';
    banner.style.display = 'block';
    setTimeout(() => { banner.style.display = 'none'; }, 3500);
}

// ==========================================
// ROSTER CONTROLLER
// ==========================================
function renderRosterView() {
    const feed = document.getElementById('prototypeRosterFeed');
    if (!feed) return;
    feed.innerHTML = "";
    
    rosterPool.forEach(p => {
        feed.innerHTML += `
            <div class="player-row-chip">
                <div>
                    <strong>${p.name}</strong>
                    <span class="pool-player-meta">${p.role} // ${p.hand}</span>
                </div>
                <span class="remove-player-trigger" onclick="removePrototypePlayer('${p.id}')">Delete</span>
            </div>`;
    });
}

function registerPrototypePlayer() {
    const nameInput = document.getElementById('newPlayerName');
    const name = nameInput.value.trim();
    if (!name) return triggerToastNotification("Player Name Required", true);
    
    const id = "p-" + (rosterPool.length + 1);
    rosterPool.push({
        id: id,
        name: name,
        role: document.getElementById('newPlayerRole').value,
        hand: document.getElementById('newPlayerHand').value
    });
    
    nameInput.value = "";
    renderRosterView();
    triggerToastNotification(`Profile committed successfully`);
}

function removePrototypePlayer(id) {
    rosterPool = rosterPool.filter(p => p.id !== id);
    renderRosterView();
}

// ==========================================
// SETUP CONTROLLER
// ==========================================
function populateSetupDropdowns() {
    const s1 = document.getElementById('setupStrikerId');
    const s2 = document.getElementById('setupNonStrikerId');
    const b1 = document.getElementById('setupBowlerId');
    if (!s1) return;
    
    s1.innerHTML = ""; s2.innerHTML = ""; b1.innerHTML = "";
    
    rosterPool.forEach((p, idx) => {
        const opt = `<option value="${p.id}" ${idx===0?'selected':''}>${p.name} (${p.role})</option>`;
        const opt2 = `<option value="${p.id}" ${idx===1?'selected':''}>${p.name} (${p.role})</option>`;
        const opt3 = `<option value="${p.id}" ${idx===2?'selected':''}>${p.name} (${p.role})</option>`;
        s1.innerHTML += opt;
        s2.innerHTML += opt2;
        b1.innerHTML += opt3;
    });
}

function initializePrototypeMatch() {
    const sId = document.getElementById('setupStrikerId').value;
    const nsId = document.getElementById('setupNonStrikerId').value;
    const bId = document.getElementById('setupBowlerId').value;
    
    if (sId === nsId) return triggerToastNotification("Striker and Non-Striker must be unique profiles", true);
    
    matchState.teamA = document.getElementById('setupTeamAName').value || "Home Side";
    matchState.teamB = document.getElementById('setupTeamBName').value || "Away Side";
    matchState.maxOvers = parseInt(document.getElementById('setupOversLimit').value);
    matchState.currentInnings = 1;
    matchState.eventLedger = [];
    
    matchState.strikerId = sId;
    matchState.nonStrikerId = nsId;
    matchState.currentBowlerId = bId;
    
    matchState.initialized = true;
    rebuildMetricsFromLedger();
    switchView('view-scorecard');
    triggerToastNotification("Match scoring engine successfully deployed");
}

function loadLiveConsoleDirectly() {
    if (!matchState.initialized) {
        return triggerToastNotification("No active engine state recorded. Complete setup first.", true);
    }
    switchView('view-scorecard');
}

// ==========================================
// CORE SCORING ENGINE MECHANICS
// ==========================================
function handlePrototypeBall(type, runs, extraType = null, dismissal = null) {
    if (!matchState.initialized) return;
    
    if (type === 'UNDO') {
        if (matchState.eventLedger.length > 0) {
            matchState.eventLedger.pop();
            rebuildMetricsFromLedger();
            renderLiveConsoleUI();
            triggerToastNotification("Last event rolled back cleanly");
        } else {
            triggerToastNotification("Ledger stack base reached", true);
        }
        return;
    }
    
    // Append tracking event block payload
    matchState.eventLedger.push({
        innings: matchState.currentInnings,
        type: type,
        runs: parseInt(runs),
        extraType: extraType,
        dismissal: dismissal,
        strikerId: matchState.strikerId,
        bowlerId: matchState.currentBowlerId
    });
    
    rebuildMetricsFromLedger();
    renderLiveConsoleUI();
}

function triggerPrototypeExtra(extType) {
    handlePrototypeBall('EXTRA', extType === 'WD' ? 0 : 0, extType);
}

function rebuildMetricsFromLedger() {
    // Generate fresh baseline schemas
    matchState.innings1 = createInningsSchema(matchState.teamA, matchState.teamB);
    matchState.innings2 = createInningsSchema(matchState.teamB, matchState.teamA);
    
    // Set active assignment references to starting context choices
    const initStriker = document.getElementById('setupStrikerId')?.value || rosterPool[0]?.id;
    const initNonStriker = document.getElementById('setupNonStrikerId')?.value || rosterPool[1]?.id;
    const initBowler = document.getElementById('setupBowlerId')?.value || rosterPool[2]?.id;
    
    matchState.strikerId = initStriker;
    matchState.nonStrikerId = initNonStriker;
    matchState.currentBowlerId = initBowler;
    
    matchState.eventLedger.forEach(event => {
        const curInn = event.innings === 1 ? matchState.innings1 : matchState.innings2;
        
        // Enforce player metrics container existence dynamically
        ensurePlayerProfileSchema(curInn, event.strikerId, event.bowlerId);
        
        let isLegalBall = true;
        
        if (event.type === 'RUN') {
            curInn.totalRuns += event.runs;
            curInn.batsmen[event.strikerId].runs += event.runs;
            curInn.bowlers[event.bowlerId].runs += event.runs;
            
            if (event.runs % 2 !== 0) switchCreasePositions();
        } 
        else if (event.type === 'EXTRA') {
            if (event.extraType === 'WD') {
                isLegalBall = false;
                curInn.totalRuns += 1;
                curInn.extras.wd += 1;
                curInn.bowlers[event.bowlerId].runs += 1;
            } else if (event.extraType === 'NB') {
                isLegalBall = false;
                curInn.totalRuns += 1;
                curInn.extras.nb += 1;
                curInn.bowlers[event.bowlerId].runs += 1;
            }
        } 
        else if (event.type === 'WICKET') {
            curInn.wickets += 1;
            curInn.bowlers[event.bowlerId].wickets += 1;
            curInn.batsmen[event.strikerId].outStatus = event.dismissal;
            matchState.strikerId = null; // Vacates crease strike slot
        }
        
        if (isLegalBall) {
            curInn.totalBalls += 1;
            curInn.batsmen[event.strikerId].balls += 1;
            curInn.bowlers[event.bowlerId].balls += 1;
            
            // Check over wrap transitions
            if (curInn.totalBalls % 6 === 0 && curInn.totalBalls > 0) {
                switchCreasePositions();
                matchState.currentBowlerId = null; // Forces bowler rotation requirement
            }
        }
    });
    
    evaluateInningsLifecycleTransitions();
}

function createInningsSchema(batTeam, bowlTeam) {
    return {
        battingTeam: batTeam,
        bowlingTeam: bowlTeam,
        totalRuns: 0,
        wickets: 0,
        totalBalls: 0,
        extras: { wd: 0, nb: 0, total: 0 },
        batsmen: {},
        bowlers: {}
    };
}

function ensurePlayerProfileSchema(inn, bId, bowlId) {
    if (bId && !inn.batsmen[bId]) {
        const pObj = rosterPool.find(x => x.id === bId);
        inn.batsmen[bId] = { name: pObj ? pObj.name : "Batsman", runs: 0, balls: 0, outStatus: "not out" };
    }
    if (bowlId && !inn.bowlers[bowlId]) {
        const pObj = rosterPool.find(x => x.id === bowlId);
        inn.bowlers[bowlId] = { name: pObj ? pObj.name : "Bowler", balls: 0, runs: 0, wickets: 0 };
    }
}

function switchCreasePositions() {
    let temp = matchState.strikerId;
    matchState.strikerId = matchState.nonStrikerId;
    matchState.nonStrikerId = temp;
}

function evaluateInningsLifecycleTransitions() {
    const curInn = matchState.currentInnings === 1 ? matchState.innings1 : matchState.innings2;
    const totalMaxBalls = matchState.maxOvers * 6;
    
    if (matchState.currentInnings === 1) {
        if (curInn.wickets >= 10 || curInn.totalBalls >= totalMaxBalls) {
            matchState.currentInnings = 2;
            switchCreasePositions(); // Rotate side out
            triggerToastNotification("First Innings Completed! Targets mapped.");
        }
    } else {
        const target = matchState.innings1.totalRuns + 1;
        if (curInn.totalRuns >= target || curInn.wickets >= 10 || curInn.totalBalls >= totalMaxBalls) {
            triggerToastNotification("Match Complete! View full log summaries.");
            switchView('view-analytics');
        }
    }
}

// ==========================================
// RENDER CONSOLE INTERFACES
// ==========================================
function renderLiveConsoleUI() {
    const curInn = matchState.currentInnings === 1 ? matchState.innings1 : matchState.innings2;
    if (!curInn) return;
    
    document.getElementById('consoleTeamDisplay').innerText = curInn.battingTeam;
    document.getElementById('consoleInningsBadge').innerText = `INNINGS ${matchState.currentInnings}`;
    document.getElementById('consoleScoreDisplay').innerText = `${curInn.totalRuns} / ${curInn.wickets}`;
    document.getElementById('consoleOversDisplay').innerText = `${Math.floor(curInn.totalBalls/6)}.${curInn.totalBalls%6}`;
    document.getElementById('consoleMaxOversDisplay').innerText = matchState.maxOvers;
    
    // Check vacant crease intercepts before allowing tracking mutations
    if (matchState.strikerId === null) {
        return promptPrototypeSub('striker');
    }
    if (matchState.nonStrikerId === null) {
        return promptPrototypeSub('non_striker');
    }
    if (matchState.currentBowlerId === null) {
        return promptPrototypeSub('bowler');
    }
    
    ensurePlayerProfileSchema(curInn, matchState.strikerId, matchState.currentBowlerId);
    ensurePlayerProfileSchema(curInn, matchState.nonStrikerId, null);
    
    const s = curInn.batsmen[matchState.strikerId];
    const ns = curInn.batsmen[matchState.nonStrikerId];
    const b = curInn.bowlers[matchState.currentBowlerId];
    
    document.getElementById('consoleStrikerRow').innerHTML = `<span>* ${s.name}</span><strong>${s.runs} (${s.balls})</strong>`;
    document.getElementById('consoleNonStrikerRow').innerHTML = `<span>${ns.name}</span><strong>${ns.runs} (${ns.balls})</strong>`;
    document.getElementById('consoleBowlerRow').innerHTML = `<span>${b.name}</span><strong>${Math.floor(b.balls/6)}.${b.balls%6} - 0 - ${b.runs} - ${b.wickets}</strong>`;
}

// ==========================================
// SUBSTITUTION OVERLAY MANAGEMENT
// ==========================================
function promptPrototypeSub(positionKey) {
    placementTargetKey = positionKey;
    const modal = document.getElementById('substitutionModal');
    const title = document.getElementById('subModalTitle');
    const select = document.getElementById('subPlayerSelect');
    if (!modal || !select) return;
    
    select.innerHTML = "";
    title.innerText = positionKey === 'bowler' ? "SELECT OVER BOWLER" : "ASSIGN NEW BATSMAN";
    
    rosterPool.forEach(p => {
        // Guard against assigning a profile already occupied at the opposite crease side
        if (p.id !== matchState.strikerId && p.id !== matchState.nonStrikerId && p.id !== matchState.currentBowlerId) {
            select.innerHTML += `<option value="${p.id}">${p.name} (${p.role})</option>`;
        }
    });
    
    modal.style.display = "flex";
}

function commitPrototypeSubstitution() {
    const val = document.getElementById('subPlayerSelect').value;
    if (!val) return triggerToastNotification("Register more players in Roster Vault first", true);
    
    if (placementTargetKey === 'striker') matchState.strikerId = val;
    if (placementTargetKey === 'non_striker') matchState.nonStrikerId = val;
    if (placementTargetKey === 'bowler') matchState.currentBowlerId = val;
    
    document.getElementById('substitutionModal').style.display = "none";
    
    rebuildMetricsFromLedger();
    renderLiveConsoleUI();
}

// ==========================================
// METRICS ANALYTICS VIEWS RENDERER
// ==========================================
function renderAnalyticsView() {
    const area = document.getElementById('analyticsOutputContainer');
    if (!area) return;
    area.innerHTML = "";
    
    [matchState.innings1, matchState.innings2].forEach((inn, index) => {
        if (!inn || inn.totalBalls === 0) return;
        
        let html = `
        <div class="bento-card full-width">
            <span class="card-label">INNINGS ${index + 1} // ${inn.battingTeam}</span>
            <h3>${inn.totalRuns} / ${inn.wickets} <span class="pool-player-meta">(${Math.floor(inn.totalBalls/6)}.${inn.totalBalls%6} Overs)</span></h3>
            
            <span class="card-sub-label">Batting Tallies</span>
            <table>
                <thead>
                    <tr><th class="text-left">Batsman</th><th>Runs</th><th>Balls</th><th class="text-right">Status</th></tr>
                </thead>
                <tbody>`;
                
        Object.entries(inn.batsmen).forEach(([id, b]) => {
            html += `<tr><td><strong>${b.name}</strong></td><td class="text-center">${b.runs}</td><td class="text-center">${b.balls}</td><td class="text-right pool-player-meta">${b.outStatus}</td></tr>`;
        });
        
        html += `</tbody></table><span class="card-sub-label">Bowling Efficiency</span><table><thead><tr><th class="text-left">Bowler</th><th>Overs</th><th>Runs</th><th class="text-right">Wickets</th></tr></thead><tbody>`;
        
        Object.entries(inn.bowlers).forEach(([id, b]) => {
            html += `<tr><td><strong>${b.name}</strong></td><td class="text-center">${Math.floor(b.balls/6)}.${b.balls%6}</td><td class="text-center">${b.runs}</td><td class="text-right">${b.wickets}</td></tr>`;
        });
        
        html += `</tbody></table></div>`;
        area.innerHTML += html;
    });
}

function accessSpectatorMatch() {
    const pin = document.getElementById('spectatorMatchCode').value.trim();
    if (!pin) return triggerToastNotification("Enter match code pin", true);
    
    // Simulate live engine attachment hook variables for standalone framework
    initializePrototypeMatch();
}

// Global initialization call on base application launch layout
document.addEventListener("DOMContentLoaded", () => {
    switchView('view-gateway');
});