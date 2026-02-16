import {
    EventsSDK,
    LocalPlayer,
    Menu,
    Vector3,
    Unit,
    ExecuteOrder,
    TickSleeper,
    GameState,
    GameRules
} from "github.com/octarine-public/wrapper/index"

const Sleeper = new TickSleeper();

const UtilityEntry = Menu.AddEntry("Utility");
const BotNode = UtilityEntry.AddNode("Smart Bot V100", "panorama/images/items/tome_of_knowledge_png.vtex_c");

// ВКЛЮЧЕН ПО УМОЛЧАНИЮ, НО МОЖНО ВЫКЛЮЧИТЬ РУКАМИ
const EnableBot = BotNode.AddToggle("Enable Movement", true);
const AutoSkill = BotNode.AddToggle("Auto Skills", true);

// КООРДИНАТЫ
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
    const Me = LocalPlayer?.Hero;
    if (!Me || !Me.IsAlive) return;

    // 1. АБСОЛЮТНЫЙ СТОП ПОСЛЕ 10 ЛВЛ
    if (Me.Level >= 10) {
        if (EnableBot.value) EnableBot.value = false;
        
        // Если 10 смертей - идем в лес
        // @ts-ignore
        if (Me.Deaths >= 10 && (Date.now() - lastMoveTick >= 3000)) {
            lastMoveTick = Date.now();
            const isRadiant = LocalPlayer.Team === 2;
            const jungle = isRadiant ? RAD_SPOTS.JUNGLE : DIRE_SPOTS.JUNGLE;
            // @ts-ignore
            Me.MoveTo(jungle);
        }
        return;
    }

    // ЕСЛИ ГАЛОЧКА ВЫКЛЮЧЕНА - КОД НЕ РАБОТАЕТ (ТЕПЕРЬ ТЫ МОЖЕШЬ ЕГО ОФНУТЬ)
    if (!EnableBot.value) return;

    const now = Date.now();

    // 2. ПРОКАЧКА (SVEN/TIDE)
    if (AutoSkill.value && Me.AbilityPoints > 0 && !Sleeper.Sleeping("skill")) {
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
            Sleeper.Sleep(1000, "skill");
        }
    }

    // 3. АВТО-КАСТ
    if (!Sleeper.Sleeping("cast_spell")) {
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

    // 4. ДВИЖЕНИЕ
    if (now - lastMoveTick >= 3000) {
        lastMoveTick = now;
        const isRadiant = LocalPlayer.Team === 2;
        const spots = isRadiant ? RAD_SPOTS : DIRE_SPOTS;
        
        let target: Vector3;

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

        const cycle = Math.floor((Me.Level - 1) / 2) % 3;
        const isHideLevel = (Me.Level % 2 !== 0);

        if (cycle === 0) target = isHideLevel ? spots.BOT_XP.Clone() : spots.BOT_LANE.Clone();
        else if (cycle === 1) target = isHideLevel ? spots.MID_XP.Clone() : spots.MID_LANE.Clone();
        else target = isHideLevel ? spots.TOP_XP.Clone() : spots.TOP_LANE.Clone();

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
