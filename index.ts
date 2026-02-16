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
    GameRules,
    Ability
} from "github.com/octarine-public/wrapper/index"

const Sleeper = new TickSleeper();

// --- МЕНЮ ---
const UtilityEntry = Menu.AddEntry("Utility");
const BotNode = UtilityEntry.AddNode("Smart Bot V95", "panorama/images/items/tome_of_knowledge_png.vtex_c");

const EnableBot = BotNode.AddToggle("Enable Movement", true); // Включено за замовчуванням
const AutoSkill = BotNode.AddToggle("Auto Level Skills", true);

// --- КООРДИНАТИ (ГЛИБОКІ НИЧКИ) ---
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
    if (!Me || !Me.IsAlive) return;

    // ==========================================
    // 1. АГРЕСИВНИЙ СТАРТ (0:00 - 1:00)
    // ==========================================
    // Якщо час гри менше 60 секунд і бот вимкнений - вмикаємо примусово
    if (GameRules && GameRules.GameTime < 60) {
        if (!EnableBot.value) {
            EnableBot.value = true;
            console.log("Force Start Bot!");
        }
    }

    // ==========================================
    // 2. KILL-SWITCH (10 РІВЕНЬ)
    // ==========================================
    if (Me.Level >= 10) {
        if (EnableBot.value) EnableBot.value = false;
        return; 
    }

    if (!EnableBot.value) return;

    // ==========================================
    // 3. ПРОКАЧКА СКІЛІВ (НОВА ЛОГІКА)
    // ==========================================
    if (AutoSkill.value && Me.AbilityPoints > 0 && !Sleeper.Sleeping("skill_up")) {
        // Спроба знайти Great Cleave або Storm Bolt
        let abilityToLevel = Me.GetAbilityByName("sven_great_cleave");
        
        if (!abilityToLevel || !abilityToLevel.CanLevelUp) {
            abilityToLevel = Me.GetAbilityByName("sven_storm_bolt");
        }
        
        // Якщо не знайшли конкретні, беремо будь-який доступний (щоб не тупив)
        if (!abilityToLevel || !abilityToLevel.CanLevelUp) {
            abilityToLevel = Me.Abilities.find(a => a.CanLevelUp && !a.IsHidden && a.Name !== "attribute_bonus");
        }

        if (abilityToLevel) {
            // @ts-ignore
            Me.UpgradeAbility(abilityToLevel);
            Sleeper.Sleep(1500, "skill_up");
        }
    }

    // ==========================================
    // 4. РУХ ТА РОТАЦІЯ (ЦИКЛ ПО ЛІНІЯХ)
    // ==========================================
    const now = Date.now();
    if (now - lastMoveTick >= 3000) {
        lastMoveTick = now;
        const isRadiant = LocalPlayer.Team === 2;
        const spots = isRadiant ? RAD_SPOTS : DIRE_SPOTS;
        
        // Визначаємо лінію по циклу (кожні 2 рівні зміна лінії)
        // Рівні 1-2: index 0 (BOT)
        // Рівні 3-4: index 1 (MID)
        // Рівні 5-6: index 2 (TOP)
        // Рівні 7-8: index 0 (BOT) ...
        const cycleIndex = Math.ceil(Me.Level / 2) % 3; 
        
        // Логіка 1/1 (Хованки / Атака)
        const isHideLevel = (Me.Level % 2 !== 0); // 1, 3, 5, 7, 9
        
        let target: Vector3;

        // ВИБІР ЛІНІЇ ЗА ЦИКЛОМ
        if (cycleIndex === 1) { // MID (Index 1 - це залишок 1, тобто рівні 3-4)
            target = isHideLevel ? spots.MID_XP.Clone() : spots.MID_LANE.Clone();
        } else if (cycleIndex === 0) { // TOP (Index 0 - це рівні 5-6)
             // Тут математика % 3 дає: 1,2->1(bot? ні, давай спростимо)
             // Давай так:
             // 1-2 -> BOT
             // 3-4 -> MID
             // 5-6 -> TOP
             // 7-8 -> BOT
             target = isHideLevel ? spots.TOP_XP.Clone() : spots.TOP_LANE.Clone();
        } else { // BOT (Решта випадків, старт)
             target = isHideLevel ? spots.BOT_XP.Clone() : spots.BOT_LANE.Clone();
        }
        
        // *ПРАВИЛЬНА ПЕРЕВІРКА ЦИКЛУ*
        // Якщо (Level+1)/2 = 1 -> Bot
        // Якщо (Level+1)/2 = 2 -> Mid
        // Якщо (Level+1)/2 = 3 -> Top
        const cycle = Math.floor((Me.Level + 1) / 2) % 3;
        if (cycle === 1) { // BOT
             target = isHideLevel ? spots.BOT_XP.Clone() : spots.BOT_LANE.Clone();
        } else if (cycle === 2) { // MID
             target = isHideLevel ? spots.MID_XP.Clone() : spots.MID_LANE.Clone();
        } else { // TOP (0)
             target = isHideLevel ? spots.TOP_XP.Clone() : spots.TOP_LANE.Clone();
        }

        // Рандом
        target.x += (Math.random() * 200 - 100);
        target.y += (Math.random() * 200 - 100);

        try {
            // @ts-ignore
            ExecuteOrder.HoldOrdersTarget = target;
            if (!isHideLevel) {
                // ПУШ (Парні рівні): Атака (A-click)
                // @ts-ignore
                Me.Attack(target); 
            } else {
                // КУЩІ (Непарні рівні): Bypass
                // @ts-ignore
                Me.MoveTo(target, false, true); 
            }
        } catch (e) {
            // @ts-ignore
            Me.MoveTo(target);
        }
    }
});
