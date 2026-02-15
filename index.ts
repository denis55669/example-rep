import { EventsSDK, GameEntitySystem, Input } from "github.com/octarine-public/wrapper/index"

const SETTINGS = {
    minHp: 400,                
    toggleKey: 0x42,           // Клавиша "B" для ручного режима
    armletName: "item_armlet",
    unholyModifier: "modifier_item_armlet_unholy_strength",
    iceBlastModifier: "modifier_ice_blast"
}

console.log("Denis's Auto-Armlet Loaded!")

EventsSDK.on("GameTick", () => {
    const me = GameEntitySystem.getLocalPlayer()
    if (!me || !me.isAlive() || me.isStunned()) return

    const armlet = me.getItemByName(SETTINGS.armletName)
    if (!armlet || !armlet.isReady()) return

    const currentHp = me.getHealth()
    const hasIceBlast = me.hasModifier(SETTINGS.iceBlastModifier)
    const isUnholyActive = me.hasModifier(SETTINGS.unholyModifier)
    const isManualPressed = Input.isKeyDown(SETTINGS.toggleKey)

    // Логика: абуз при низком ХП или зажатой кнопке B, если нет ульты Аппарата
    if (!hasIceBlast && (currentHp <= SETTINGS.minHp || isManualPressed)) {
        if (isUnholyActive) {
            armlet.cast() // Выключить
            armlet.cast() // Включить
            console.log("Armlet Toggled!")
        } else {
            armlet.cast() // Просто включить
        }
    }
})
