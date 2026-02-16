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
const BotNode = UtilityEntry.AddNode("Smart Bot V105", "panorama/images/items/tome_of_knowledge_png.vtex_c");

const EnableBot = BotNode.AddToggle("Enable Movement", true);
const AutoSkill = BotNode.AddToggle("Auto Skills (Spam)", true);
const AutoCast = BotNode.AddToggle("Auto Cast (Spells)", true);
const AutoQueue = BotNode.AddToggle("Auto Find (All Pick)", true);

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
let quickbuyDone = false;

EventsSDK.on("PostDataUpdate", () => {
    // 1. АВТО-ПОШУК (в меню)
    if (AutoQueue.value) {
        if (GameState.IsMatchFound && !GameState.HasAccepted) {
            EventsSDK.ExecuteCommand("dota_accept_match");
        }
        if (GameState.IsPostGame) {
             EventsSDK.ExecuteCommand("disconnect"); 
        }
        if (!GameState.IsInGame && !GameState.IsSearching && !GameState.IsMatchFound) {
            if (!Sleeper.Sleeping("queue")) {
                EventsSDK.ExecuteCommand("dota_match_game_modes 1"); 
                EventsSDK.ExecuteCommand("dota_match_find_match");
                Sleeper.Sleep(5000, "queue");
                quickbuyDone = false;
                if (!EnableBot.value) EnableBot.value = true;
            }
        }
    }

    if (!GameState.IsInGame) return;

    const Me = LocalPlayer?.Hero;
    if (!Me || !Me.IsAlive) return;

    // 2. АВТО-СТАРТ (Завжди вмикаємо, якщо рівень < 2)
    if (Me.Level < 2 && GameRules && GameRules.GameTime < 60) {
        if (!EnableBot.value) EnableBot.value = true;
    }

    // 3. СТОП НА 6 РІВНІ (Як ти просив)
    if (Me.Level >= 6) {
        if (EnableBot.value) {
            EnableBot.value = false; // Вимикаємо
            console.log("Level 6 reached. Bot Stopped.");
        }
        return; // Повний стоп
    }

    if (!EnableBot.value) return;

    // 4. QUICKBUY (Раз на гру)
    if (!quickbuyDone) {
        EventsSDK.ExecuteCommand("dota_shop_force_assign_quickbuy item_power_treads");
        EventsSDK.ExecuteCommand("dota_shop_item_add_to_quickbuy item_bfury");
        EventsSDK.ExecuteCommand("dota_shop_item_add_to_quickbuy item_mask_of_madness");
        quickbuyDone = true;
    }

    // 5. ПРОКАЧКА (Анти-АФК)
    if (AutoSkill.value && Me.AbilityPoints > 0 && !Sleeper.Sleeping("skill_up")) {
        let ability = null;
        if (Me.UnitName === "npc_dota_hero_sven") {
            const s2 = Me.GetAbilityByName("sven_great_cleave");
            const s3 = Me.GetAbilityByName("sven_warcry");
            const ult = Me.GetAbilityByName("sven_gods_strength");
            if (ult?.CanLevelUp) ability = ult;
            else if (s2?.CanLevelUp) ability = s2;
            else if (s3?.CanLevelUp) ability = s3;
        } else if (Me.UnitName === "npc_dota_hero_tidehunter") {
            const s2 = Me.GetAbilityByName("tidehunter_kraken_shell");
            const s3 = Me.GetAbilityByName("tidehunter_anchor_smash");
            const ult = Me.GetAbilityByName("tidehunter_ravage");
            if (ult?.CanLevelUp) ability = ult;
            else if (s3?.CanLevelUp) ability = s3;
            else if (s2?.CanLevelUp) ability = s2;
        }

        if (!ability) ability = Me.Abilities.find(a => a.CanLevelUp && !a.IsHidden && a.Name !== "attribute_bonus");
        if (!ability) ability = Me.Abilities.find(a => a.CanLevelUp && a.Name === "attribute_bonus");

        if (ability) {
            // @ts-ignore
            Me.UpgradeAbility(ability);
            Sleeper.Sleep(1000, "skill_up");
        }
    }

    // 6. АВТО-КАСТ (ВИПРАВЛЕНИЙ)
    if (AutoCast.value && !Sleeper.Sleeping("cast_spell")) {
        // Я додав || (OR), яких не вистачало у твоєму коді
        const spells = Me.Abilities.filter(a => 
            (a.Name.includes("warcry") || a.Name.includes("anchor_smash") || a.Name.includes("gods_strength") || a.Name.includes("ravage")) 
            && a.CanBeCasted() && a.ManaCost <= Me.Mana
        );

        for (const s of spells) {
            // @ts-ignore
            Me.CastNoTarget(s);
            Sleeper.Sleep(2000, "cast_spell");
            break;
        }
    }

    // 7. РУХ (ТВІЙ РОБОЧИЙ МЕТОД)
    const now = Date.now();
    if (now - lastMoveTick >= 3000) {
        lastMoveTick = now;
        const isRadiant = LocalPlayer.Team === 2;
        const spots = isRadiant ? RAD_SPOTS : DIRE_SPOTS;
        
        let target: Vector3;

        // 10 Смертей = Ліс
        // @ts-ignore
        if (Me.Deaths >= 10) {
            target = spots.JUNGLE.Clone();
            target.x += (Math.random() * 1000 - 500);
            target.y += (Math.random() * 1000 - 500);
            try { 
                // @ts-ignore
                Me.MoveTo(target); 
            } catch (e) {}
            return;
        }

        // Цикл ліній
        const cycle = Math.floor((Me.Level - 1) / 2) % 3;
        const isHideLevel = (Me.Level % 2 !== 0); 

        if (cycle === 0) { // BOT
            target = isHideLevel ? spots.BOT_XP.Clone() : spots.BOT_LANE.Clone();
        } else if (cycle === 1) { // MID
            target = isHideLevel ? spots.MID_XP.Clone() : spots.MID_LANE.Clone();
        } else { // TOP
            target = isHideLevel ? spots.TOP_XP.Clone() : spots.TOP_LANE.Clone();
        }

        target.x += (Math.random() * 200 - 100);
        target.y += (Math.random() * 200 - 100);

        try {
            // @ts-ignore
            ExecuteOrder.HoldOrdersTarget = target;
            if (!isHideLevel) {
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
