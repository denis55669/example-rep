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
    Ability
} from "github.com/octarine-public/wrapper/index"

const Sleeper = new TickSleeper();

// --- МЕНЮ ---
const UtilityEntry = Menu.AddEntry("Utility");
const BotNode = UtilityEntry.AddNode("Smart Bot V98", "panorama/images/items/tome_of_knowledge_png.vtex_c");

const EnableBot = BotNode.AddToggle("Enable Logic", true);
const AutoSkill = BotNode.AddToggle("Auto Skills", true);
const AutoAccept = BotNode.AddToggle("Auto Accept", true);

// --- КООРДИНАТИ (ГЛИБОКІ НИЧКИ) ---
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

EventsSDK.on("PostDataUpdate", () => {
    // 1. АВТО-ПРИНЯТИЕ (Завжди працює)
    if (AutoAccept.value && GameState.IsMatchFound && !GameState.HasAccepted) {
        EventsSDK.ExecuteCommand("dota_accept_match");
    }

    // Перевірка на гру
    if (!GameState.IsInGame) return;
    const Me = LocalPlayer?.Hero;
    if (!Me || !Me.IsAlive) return;

    // ==========================================
    // 2. АВТО-СТАРТ (0:00 - 1:00)
    // ==========================================
    // Якщо рівень менше 2 і час менше 60 сек - ВМИКАЄМО
    if (Me.Level < 2 && GameRules && GameRules.GameTime < 60) {
        if (!EnableBot.value) EnableBot.value = true;
    }

    // ==========================================
    // 3. СТОП НА 10 РІВНІ (Kill-Switch)
    // ==========================================
    if (Me.Level >= 10) {
        if (EnableBot.value) {
            EnableBot.value = false; // Вимикаємо
            console.log("Level 10 reached. Bot OFF.");
        }
        
        // Якщо 10 смертей - йдемо в ліс (щоб не стояти на базі)
        // @ts-ignore
        if (Me.Deaths >= 10 && (Date.now() - lastMoveTick >= 3000)) {
            lastMoveTick = Date.now();
            const isRadiant = LocalPlayer.Team === 2;
            const jungle = isRadiant ? RAD_SPOTS.JUNGLE : DIRE_SPOTS.JUNGLE;
            // @ts-ignore
            Me.MoveTo(jungle);
        }
        return; // Далі код не виконується
    }

    if (!EnableBot.value) return;

    // ==========================================
    // 4. ПРОКАЧКА СКІЛІВ (SVEN / TIDE Fix)
    // ==========================================
    if (AutoSkill.value && Me.AbilityPoints > 0 && !Sleeper.Sleeping("skill")) {
        let ability = null;

        // Пріоритети для Свена/Тайда
        if (Me.UnitName === "npc_dota_hero_sven") {
            const cleave = Me.GetAbilityByName("sven_great_cleave");
            const warcry = Me.GetAbilityByName("sven_warcry");
            const ult = Me.GetAbilityByName("sven_gods_strength");
            if (ult?.CanLevelUp) ability = ult;
            else if (cleave?.CanLevelUp) ability = cleave;
            else if (warcry?.CanLevelUp) ability = warcry;
        } else if (Me.UnitName === "npc_dota_hero_tidehunter") {
            const anchor = Me.GetAbilityByName("tidehunter_anchor_smash");
            const kraken = Me.GetAbilityByName("tidehunter_kraken_shell");
            const ult = Me.GetAbilityByName("tidehunter_ravage");
            if (ult?.CanLevelUp) ability = ult;
            else if (anchor?.CanLevelUp) ability = anchor;
            else if (kraken?.CanLevelUp) ability = kraken;
        }

        // Якщо нічого не знайшли - беремо ПЕРШИЙ ДОСТУПНИЙ (щоб не тупив)
        if (!ability) {
            ability = Me.Abilities.find(a => a.CanLevelUp && !a.IsHidden && a.Name !== "attribute_bonus");
        }
        // Якщо і скілів нема - плюсики
        if (!ability) {
            ability = Me.Abilities.find(a => a.CanLevelUp && a.Name === "attribute_bonus");
        }

        if (ability) {
            // @ts-ignore
            Me.UpgradeAbility(ability);
            Sleeper.Sleep(1000, "skill");
        }
    }

    // ==========================================
    // 5. РУХ ТА АТАКА (ГОЛОВНИЙ ЦИКЛ)
    // ==========================================
    const now = Date.now();
    if (now - lastMoveTick >= 3000) {
        lastMoveTick = now;
        const isRadiant = LocalPlayer.Team === 2;
        const spots = isRadiant ? RAD_SPOTS : DIRE_SPOTS;

        // Вибір лінії: (1-2) -> BOT, (3-4) -> MID, (5-6) -> TOP
        const cycle = Math.floor((Me.Level + 1) / 2) % 3;
        
        // Режим: Непарний (1,3,5) = Ховаємось, Парний (2,4,6) = Пушимо
        const isHide = (Me.Level % 2 !== 0); 

        let target: Vector3;
        
        if (cycle === 1) target = isHide ? spots.BOT_XP.Clone() : spots.BOT_LANE.Clone();
        else if (cycle === 2) target = isHide ? spots.MID_XP.Clone() : spots.MID_LANE.Clone();
        else target = isHide ? spots.TOP_XP.Clone() : spots.TOP_LANE.Clone();

        // Рандом, щоб не палитися
        target.x += (Math.random() * 200 - 100);
        target.y += (Math.random() * 200 - 100);

        try {
            // @ts-ignore
            ExecuteOrder.HoldOrdersTarget = target; // Важливо для байпасу

            if (!isHide) {
                // ПАРНИЙ РІВЕНЬ: Атака через Attack Move (червоний клік)
                // @ts-ignore
                Me.Attack(target);
            } else {
                // НЕПАРНИЙ РІВЕНЬ: Рух через Bypass (зелений клік крізь дерева)
                // @ts-ignore
                Me.MoveTo(target, false, true);
            }
        } catch (e) {
            // @ts-ignore
            Me.MoveTo(target);
        }
    }
});

console.log("V98 Loaded: Force Start & Aggressive Fix");
