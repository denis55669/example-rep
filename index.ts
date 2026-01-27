import {
    Ability,
    EntityManager,
    EventsSDK,
    GameState,
    Hero,
    ImageData,
    item_armlet,
    LocalPlayer,
    Menu,
    NPC,
    PlayerCustomData,
    Unit
} from "github.com/octarine-public/wrapper/index"

new (class CArmletAbuse {
    private readonly entry = Menu.AddEntry("Utility")
    private readonly menu = this.entry.AddNode(
        "Armlet Abuse",
        ImageData.GetItemTexture("item_armlet"),
        "Автоматический абуз армлета"
    )
    
    // Основные настройки
    private readonly state = this.menu.AddToggle("Включить", true)
    private readonly hpThreshold = this.menu.AddSlider("Порог HP", 300, 100, 600)
    private readonly stopAttack = this.menu.AddToggle("Остановить атаку", true)
    
    // Безопасность
    private readonly safetyNode = this.menu.AddNode("Безопасность")
    private readonly dotBlock = this.safetyNode.AddToggle("Блок при DoT", true)
    private readonly checkEnemies = this.safetyNode.AddToggle("Проверять врагов", true)
    private readonly enemyRadius = this.safetyNode.AddSlider("Радиус врагов", 1000, 500, 2000)
    
    private lastToggleTime = 0
    private toggleDelay = 250 // мс между переключениями

    constructor() {
        EventsSDK.on("GameEnded", this.GameEnded.bind(this))
        EventsSDK.on("GameStarted", this.GameStarted.bind(this))
        EventsSDK.on("Update", this.OnUpdate.bind(this))
    }

    private get LocalHero(): Nullable<Hero> {
        return LocalPlayer?.Hero
    }

    private GameEnded() {
        this.lastToggleTime = 0
    }

    private GameStarted() {
        this.lastToggleTime = 0
    }

    private OnUpdate() {
        if (!this.state.value) return
        
        const hero = this.LocalHero
        if (!hero || !hero.IsAlive) return
        
        const armlet = this.FindArmlet(hero)
        if (!armlet) return
        
        // Проверяем безопасность
        if (!this.IsSafeToToggle(hero)) return
        
        const health = hero.Health
        const isToggled = armlet.IsToggled
        
        // Логика абуза
        if (health <= this.hpThreshold.value && isToggled) {
            this.PerformAbuse(armlet, hero)
        }
    }

    private FindArmlet(hero: Hero): Nullable<item_armlet> {
        // Ищем армлет в инвентаре
        for (let i = 0; i < 6; i++) {
            const item = hero.GetItemByIndex(i)
            if (item instanceof item_armlet) {
                return item
            }
        }
        return undefined
    }

    private IsSafeToToggle(hero: Hero): boolean {
        // Проверка DoT эффектов
        if (this.dotBlock.value) {
            const dangerousModifiers = [
                "modifier_queenofpain_shadow_strike",
                "modifier_venomancer_poison_nova", 
                "modifier_huskar_burning_spear",
                "modifier_item_urn_damage",
                "modifier_item_spirit_vessel"
            ]
            
            for (const modName of dangerousModifiers) {
                const modifier = hero.GetModifierByName(modName)
                if (modifier && !modifier.IsHidden) {
                    return false
                }
            }
        }
        
        // Проверка врагов поблизости
        if (this.checkEnemies.value) {
            const enemies = EntityManager.GetEntitiesByClass(NPC)
            for (const enemy of enemies) {
                if (!enemy.IsAlive || enemy.Team === hero.Team) continue
                
                if (enemy.IsHero || enemy.IsIllusion) {
                    const distance = hero.Position.Distance(enemy.Position)
                    if (distance <= this.enemyRadius.value) {
                        return false
                    }
                }
            }
        }
        
        return true
    }

    private CanToggle(): boolean {
        const currentTime = GameState.RawGameTime * 1000
        return (currentTime - this.lastToggleTime) >= this.toggleDelay
    }

    private PerformAbuse(armlet: item_armlet, hero: Hero) {
        if (!this.CanToggle()) return
        if (!armlet.CanBeCasted()) return
        
        // Останавливаем атаку если нужно
        if (this.stopAttack.value) {
            // Можно добавить остановку атаки здесь
        }
        
        // Быстрое выключение-включение
        armlet.Toggle() // Выключить
        armlet.Toggle() // Включить
        
        this.lastToggleTime = GameState.RawGameTime * 1000
        
        // Лог в консоль
        console.log(`[Armlet] Abuse at ${hero.Health} HP`)
    }
})()