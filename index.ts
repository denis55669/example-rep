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
const BotNode = UtilityEntry.AddNode("Smart Bot V96", "panorama/images/items/tome_of_knowledge_png.vtex_c");

const EnableBot = BotNode.AddToggle("Enable Movement", true);
const AutoSkill = BotNode.AddToggle("Auto Skills (2 & 3 priority)", true);
const AutoCast = BotNode.AddToggle("Auto Cast (3rd & Ult)", true); // Тиснути кнопки

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

EventsSDK.on("PostDataUpdate", () => {
    // 1. АВТО-СТАРТ (0:00)
    if (GameRules && GameRules.GameTime < 60 && !EnableBot.value) {
        EnableBot.value = true;
    }

    if (!EnableBot.value) return;

    const Me = LocalPlayer?.Hero;
    if (!Me || !Me.IsAlive) return;

    // ==========================================
    // 2. ПРОКАЧКА СКІЛІВ (SVEN / TIDE)
    // ==========================================
    // Логіка: 2 -> 3 -> 2 -> 3 -> 2 -> 3 -> 2 -> 3 -> ULT
    if (AutoSkill.value && Me.AbilityPoints > 0 && !Sleeper.Sleeping("skill_up")) {
        // Визначаємо імена скілів для героїв
        let skill2Name = ""; // Пасивка/Кракена
        let skill3Name = ""; // Армор/Якір
        let ultName = "";

        if (Me.UnitName === "npc_dota_hero_sven") {
            skill2Name = "sven_great_cleave";
            skill3Name = "sven_warcry";
            ultName = "sven_gods_strength";
        } else if (Me.UnitName === "npc_dota_hero_tidehunter") {
            skill2Name = "tidehunter_kraken_shell";
            skill3Name = "tidehunter_anchor_smash";
            ultName = "tidehunter_ravage";
        }

        let abilityToLevel: Ability | null = null;

        // Якщо це Свен або Тайд, пробуємо качати по схемі
        if (skill2Name !== "") {
            const s2 = Me.GetAbilityByName(skill2Name);
            const s3 = Me.GetAbilityByName(skill3Name);
            const ult = Me.GetAbilityByName(ultName);

            // Пріоритет: Ульт -> 2 скіл -> 3 скіл
            if (ult && ult.CanLevelUp) abilityToLevel = ult;
            else if (s2 && s2.CanLevelUp && s2.Level <= s3.Level + 1) abilityToLevel = s2; // Тримаємо баланс або максимо 2
            else if (s3 && s3.CanLevelUp) abilityToLevel = s3;
            else if (s2 && s2.CanLevelUp) abilityToLevel = s2;
        }

        // ЗАПОБІЖНИК: Якщо ми не знайшли, що качати (або це не Свен/Тайд), 
        // або скіли замакшені - качаємо БУДЬ-ЩО, щоб не стояти АФК
        if (!abilityToLevel) {
            abilityToLevel = Me.Abilities.find(a => a.CanLevelUp && !a.IsHidden && a.Name !== "attribute_bonus");
        }
        
        // Останній шанс: плюсики
        if (!abilityToLevel) {
            abilityToLevel = Me.Abilities.find(a => a.CanLevelUp && a.Name === "attribute_bonus");
        }

        if (abilityToLevel) {
            // @ts-ignore
            Me.UpgradeAbility(abilityToLevel);
            Sleeper.Sleep(500, "skill_up"); // Коротка пауза
        }
    }

    // ==========================================
    // 3. АВТО-КАСТ (ТИСНУТИ КНОПКИ)
    // ==========================================
    if (AutoCast.value && !Sleeper.Sleeping("cast_spells")) {
        // Тиснемо 3-й скіл (Warcry / Anchor Smash) та Ульт
        // Це ненаправлені скіли (NoTarget), тому просто CastNoTarget
        const abilities = Me.Abilities.filter(a => !a.IsPassive && a.IsCastable && a.ManaCost <= Me.Mana);
        
        for (const spell of abilities) {
            // Перевіряємо, чи це 3-й скіл або Ульт (зазвичай індекси 2 і 5, або за назвою)
            const isTargetSpell = spell.Name.includes("warcry") || spell.Name.includes("gods_strength") || 
                                  spell.Name.includes("anchor_smash") || spell.Name.includes("ravage");
            
            if (isTargetSpell) {
                // @ts-ignore
                Me.CastNoTarget(spell);
                Sleeper.Sleep(1000, "cast_spells"); // Не спамимо все одразу
                break; 
            }
        }
    }

    // ==========================================
    // 4. ЛОГІКА РУХУ
    // ==========================================
    const now = Date.now();
    if (now - lastMoveTick >= 3000) {
        lastMoveTick = now;
        const isRadiant = LocalPlayer.Team === 2;
        const spots = isRadiant ? RAD_SPOTS : DIRE_SPOTS;
        
        let target: Vector3;

        // --- УМОВА: 10 СМЕРТЕЙ -> ЙДЕМО В ЛІС ---
        // @ts-ignore
        if (Me.Deaths >= 10) {
            target = spots.JUNGLE.Clone();
            // Гуляємо по лісу
            target.x += (Math.random() * 1500 - 750);
            target.y += (Math.random() * 1500 - 750);
            
            // Якщо вороги поруч, тікаємо (опціонально, але для лісу норм просто ходити)
            try {
                 // @ts-ignore
                 Me.MoveTo(target);
            } catch(e) {}
            return; // Далі код не йде, ми в лісі назавжди
        }

        // --- ЦИКЛ ЛІНІЙ (ДО 10 СМЕРТЕЙ) ---
        // 1-2 рівень: Низ
        // 3-4 рівень: Мід
        // 5-6 рівень: Верх
        const cycle = Math.floor((Me.Level + 1) / 2) % 3;
        const isHideLevel = (Me.Level % 2 !== 0); // 1, 3, 5, 7, 9 - Ховаємось

        if (cycle === 1) target = isHideLevel ? spots.BOT_XP.Clone() : spots.BOT_LANE.Clone();
        else if (cycle === 2) target = isHideLevel ? spots.MID_XP.Clone() : spots.MID_LANE.Clone();
        else target = isHideLevel ? spots.TOP_XP.Clone() : spots.TOP_LANE.Clone();

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

console.log("V96 Loaded: Sven/Tide Fix + Death Limit");
