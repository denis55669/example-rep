import {
    EventsSDK,
    LocalPlayer,
    Menu,
    Vector3,
    Unit,
    ExecuteOrder,
    TickSleeper,
    GameState,
    GameRules,
    Ability,
    Entity
} from "github.com/octarine-public/wrapper/index"

const Sleeper = new TickSleeper();

// --- МЕНЮ ---
const UtilityEntry = Menu.AddEntry("Utility");
const BotNode = UtilityEntry.AddNode("Smart Bot V97", "panorama/images/items/tome_of_knowledge_png.vtex_c");

const EnableBot = BotNode.AddToggle("Enable Bot Logic", true);
const AutoSkill = BotNode.AddToggle("Auto Skills (Sven/Tide)", true);
const AutoCast = BotNode.AddToggle("Auto Cast (Spells)", true);
const AutoAccept = BotNode.AddToggle("Auto Accept & Queue", true);

// --- КООРДИНАТИ ---
const RAD_SPOTS = {
    BOT_XP: new Vector3(6600, -6600, 256),  
    BOT_LANE: new Vector3(6200, -5800, 256), 
    MID_XP: new Vector3(-1100, -1100, 256), 
    MID_LANE: new Vector3(-500, -500, 256),
    TOP_XP: new Vector3(-6600, 5200, 256), 
    TOP_LANE: new Vector3(-5800, 5200, 256),
    JUNGLE: new Vector3(1000, -4000, 256)
};

const DIRE_SPOTS = {
    BOT_XP: new Vector3(6600, -4800, 256), 
    BOT_LANE: new Vector3(6000, -5200, 256),
    MID_XP: new Vector3(1100, 1100, 256),
    MID_LANE: new Vector3(500, 500, 256),
    TOP_XP: new Vector3(-4800, 6600, 256), 
    TOP_LANE: new Vector3(-5200, 6000, 256),
    JUNGLE: new Vector3(4000, 3000, 256)
};

let lastMoveTick = 0;
let isFinished = false; // Прапор, що бот виконав завдання на цю гру

EventsSDK.on("PostDataUpdate", () => {
    // 1. АВТО-ПРИНЯТИЕ И ПОИСК (ПРАЦЮЄ ЗАВЖДИ, НАВІТЬ ЯКЩО БОТ ВИМКНЕНИЙ)
    if (AutoAccept.value) {
        if (GameState.IsMatchFound && !GameState.HasAccepted) {
            EventsSDK.ExecuteCommand("dota_accept_match");
        }
        // Якщо ми не в грі і не шукаємо - шукаємо
        if (!GameState.IsInGame && !GameState.IsSearching && !GameState.IsMatchFound) {
             if (!Sleeper.Sleeping("queue_start")) {
                EventsSDK.ExecuteCommand("dota_match_game_modes 1");
                EventsSDK.ExecuteCommand("dota_match_find_match");
                Sleeper.Sleep(5000, "queue_start");
                // Скидаємо прапор для нової гри
                isFinished = false; 
                if (!EnableBot.value) EnableBot.value = true; // Вмикаємо назад для нової гри
             }
        }
    }

    // Якщо ми не в матчі - далі код не потрібен
    if (!GameState.IsInGame) return;

    const Me = LocalPlayer?.Hero;
    if (!Me || !Me.IsAlive) return;

    // ==========================================
    // 2. ЛОГІКА ВИМИКАННЯ (10 РІВЕНЬ)
    // ==========================================
    if (Me.Level >= 10) {
        if (!isFinished) {
            console.log("Level 10 reached. Bot Sleep Mode ON.");
            isFinished = true; // Бот закінчив роботу
        }
        
        // 10 СМЕРТЕЙ -> Йдемо в ліс (виняток з правила "вимкнути", щоб не фідіти)
        // @ts-ignore
        if (Me.Deaths >= 10 && (Date.now() - lastMoveTick >= 3000)) {
            lastMoveTick = Date.now();
            const isRadiant = LocalPlayer.Team === 2;
            const jungle = isRadiant ? RAD_SPOTS.JUNGLE : DIRE_SPOTS.JUNGLE;
            // @ts-ignore
            Me.MoveTo(jungle);
        }
        
        return; // Більше нічого не робимо (скіли, закуп, лінії - стоп)
    }

    if (!EnableBot.value) return;

    // ==========================================
    // 3. АВТО-СТАРТ (0:00)
    // ==========================================
    // Якщо гра почалася, а прапор isFinished висить з минулої гри (баг) - скидаємо
    if (Me.Level < 2 && isFinished) {
        isFinished = false;
    }

    // ==========================================
    // 4. ПРОКАЧКА І КАСТ (SVEN / TIDE)
    // ==========================================
    if (AutoSkill.value && Me.AbilityPoints > 0 && !Sleeper.Sleeping("skill_up")) {
        let s2Name = "", s3Name = "", ultName = "";
        if (Me.UnitName === "npc_dota_hero_sven") {
            s2Name = "sven_great_cleave"; s3Name = "sven_warcry"; ultName = "sven_gods_strength";
        } else if (Me.UnitName === "npc_dota_hero_tidehunter") {
            s2Name = "tidehunter_kraken_shell"; s3Name = "tidehunter_anchor_smash"; ultName = "tidehunter_ravage";
        }

        let ability = null;
        if (s2Name) {
            const s2 = Me.GetAbilityByName(s2Name);
            const s3 = Me.GetAbilityByName(s3Name);
            const ult = Me.GetAbilityByName(ultName);
            // Пріоритет: ULT > 2 > 3
            if (ult?.CanLevelUp) ability = ult;
            else if (s2?.CanLevelUp && (s2.Level <= s3.Level + 1 || !s3)) ability = s2;
            else if (s3?.CanLevelUp) ability = s3;
            else if (s2?.CanLevelUp) ability = s2;
        }
        
        if (!ability) ability = Me.Abilities.find(a => a.CanLevelUp && !a.IsHidden && a.Name !== "attribute_bonus");
        if (!ability) ability = Me.Abilities.find(a => a.CanLevelUp && a.Name === "attribute_bonus");

        if (ability) {
            // @ts-ignore
            Me.UpgradeAbility(ability);
            Sleeper.Sleep(500, "skill_up");
        }
    }

    if (AutoCast.value && !Sleeper.Sleeping("cast")) {
        const spells = Me.Abilities.filter(a => (a.Name.includes("warcry") || a.Name.includes("gods_strength") || a.Name.includes("anchor") || a.Name.includes("ravage")) && a.CanBeCasted());
        for (const s of spells) {
            // @ts-ignore
            Me.CastNoTarget(s);
            Sleeper.Sleep(1000, "cast");
            break;
        }
    }

    // ==========================================
    // 5. РУХ (ЦИКЛ ЛІНІЙ)
    // ==========================================
    const now = Date.now();
    if (now - lastMoveTick >= 3000) {
        lastMoveTick = now;
        const isRadiant = LocalPlayer.Team === 2;
        const spots = isRadiant ? RAD_SPOTS : DIRE_SPOTS;
        
        // Цикл: 1-2(Bot), 3-4(Mid), 5-6(Top)
        const cycle = Math.floor((Me.Level + 1) / 2) % 3;
        const isHide = (Me.Level % 2 !== 0); // 1, 3, 5, 7, 9

        let target: Vector3;
        if (cycle === 1) target = isHide ? spots.BOT_XP.Clone() : spots.BOT_LANE.Clone();
        else if (cycle === 2) target = isHide ? spots.MID_XP.Clone() : spots.MID_LANE.Clone();
        else target = isHide ? spots.TOP_XP.Clone() : spots.TOP_LANE.Clone();

        target.x += (Math.random() * 200 - 100);
        target.y += (Math.random() * 200 - 100);

        try {
            // @ts-ignore
            ExecuteOrder.HoldOrdersTarget = target;
            if (!isHide) {
                // @ts-ignore
                Me.Attack(target);
            } else {
                // @ts-ignore
                Me.MoveTo(target, false, true);
            }
        } catch (e) {
            // @ts-ignore
            Me.MoveTo(target);
        }
    }
});

console.log("V97: Auto-Reset & Level 10 Stop Loaded");
