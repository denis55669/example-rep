import {
    EventsSDK,
    LocalPlayer,
    Menu,
    Vector3,
    Unit,
    ExecuteOrder,
    TickSleeper,
    GameState,
    EntityManager,
    GameRules
} from "github.com/octarine-public/wrapper/index"

const Sleeper = new TickSleeper();

// --- МЕНЮ (Utility -> Smart Bot) ---
const UtilityEntry = Menu.AddEntry("Utility");
const BotNode = UtilityEntry.AddNode("Smart Bot", "panorama/images/items/tome_of_knowledge_png.vtex_c");

const EnableBot = BotNode.AddToggle("Enable Movement", false);
const AutoSkill = BotNode.AddToggle("Auto Level Skills (Sven 2nd)", true);
const AutoItems = BotNode.AddToggle("Auto Buy Items", true);

// --- КООРДИНАТИ ДЛЯ ПУШУ ТА КУЩІВ ---
const RAD_SPOTS = {
    BOT_XP: new Vector3(6600, -6600, 256),  
    BOT_LANE: new Vector3(6200, -5800, 256), 
    MID_XP: new Vector3(-1100, -1100, 256), 
    MID_LANE: new Vector3(-500, -500, 256),
    TOP_XP: new Vector3(-6600, 5200, 256), 
    TOP_LANE: new Vector3(-5800, 5200, 256)
};

const DIRE_SPOTS = {
    BOT_XP: new Vector3(6600, -4800, 256), 
    BOT_LANE: new Vector3(6000, -5200, 256),
    MID_XP: new Vector3(1100, 1100, 256),
    MID_LANE: new Vector3(500, 500, 256),
    TOP_XP: new Vector3(-4800, 6600, 256), 
    TOP_LANE: new Vector3(-5200, 6000, 256)
};

let lastMoveTick = 0;

EventsSDK.on("PostDataUpdate", () => {
    const Me = LocalPlayer?.Hero;
    if (!Me || !Me.IsAlive || !EnableBot.value) return;
    const now = Date.now();

    // 1. ПРОКАЧКА СВЕНА (2-Й СКІЛ)
    if (AutoSkill.value && Me.AbilityPoints > 0 && !Sleeper.Sleeping("skill_up")) {
        const cleave = Me.GetAbilityByName("sven_great_cleave");
        const targetAbility = (cleave && cleave.CanLevelUp) ? cleave : Me.GetAbilityByName("sven_storm_bolt");
        if (targetAbility) {
            // @ts-ignore
            Me.UpgradeAbility(targetAbility);
            Sleeper.Sleep(2000, "skill_up");
        }
    }

    // 2. ЗАКУП (ПТ -> БФ -> МОМ)
    if (AutoItems.value && !Sleeper.Sleeping("buy_logic")) {
        const items = ["item_power_treads", "item_bfury", "item_mask_of_madness"];
        for (const itemName of items) {
            if (!Me.GetItemByName(itemName)) {
                // @ts-ignore
                Me.PurchaseItem(itemName);
                Sleeper.Sleep(5000, "buy_logic");
                break;
            }
        }
    }

    // 3. ЛОГІКА РУХУ ТА ПУШУ
    if (now - lastMoveTick >= 3000) {
        lastMoveTick = now;
        const isRadiant = LocalPlayer.Team === 2;
        const spots = isRadiant ? RAD_SPOTS : DIRE_SPOTS;
        
        // ПЕРЕВІРКА ЧАСУ (10 ХВИЛИН = 600 СЕКУНД)
        const gameTime = GameRules ? GameRules.GameTime : 0;
        const isLateGame = gameTime > 600;

        let target: Vector3;
        let forceAttack = false;

        if (isLateGame) {
            // ПІСЛЯ 10 ХВИЛИНИ: Цикл ліній кожні 2 рівні
            // 10-11: Низ, 12-13: Мід, 14-15: Верх
            const laneCycle = Math.floor((Me.Level - 10) / 2) % 3;
            if (laneCycle === 0) target = spots.BOT_LANE.Clone();
            else if (laneCycle === 1) target = spots.MID_LANE.Clone();
            else target = spots.TOP_LANE.Clone();
            
            forceAttack = true; // Завжди б'ємо на лініях
        } else {
            // ДО 10 ХВИЛИНИ: Твоя схема 1/1 рівень
            const isHideLevel = (Me.Level % 2 !== 0);
            if (Me.Level < 2) {
                target = isHideLevel ? spots.BOT_XP.Clone() : spots.BOT_LANE.Clone();
            } else if (Me.Level < 6) {
                target = isHideLevel ? spots.MID_XP.Clone() : spots.MID_LANE.Clone();
            } else {
                target = isHideLevel ? spots.TOP_XP.Clone() : spots.TOP_LANE.Clone();
            }
            forceAttack = !isHideLevel;
        }

        // Рандом для безпалевності
        target.x += (Math.random() * 300 - 150);
        target.y += (Math.random() * 300 - 150);

        try {
            // @ts-ignore
            ExecuteOrder.HoldOrdersTarget = target;
            if (forceAttack) {
                // РЕЖИМ ПУШУ: Йдемо і б'ємо все на шляху
                // @ts-ignore
                Me.Attack(target);
            } else {
                // РЕЖИМ ХОВАНКИ: Тільки Bypass у кущі
                // @ts-ignore
                Me.MoveTo(target, false, true); 
            }
        } catch (e) {
            // @ts-ignore
            Me.MoveTo(target);
        }
    }
});
