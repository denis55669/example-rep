import { EventsSDK, GameSDK, ItemSDK, Menu, ImageData } from "github.com/octarine-public/wrapper/index"

// Створюємо меню
const MyScripts = Menu.AddEntryDeep(["Custom Scripts", "Денис"])
const ArmletNode = MyScripts.AddNode("Абуз Армлета", ImageData.Icons.item_armlet)

const IsEnabled = ArmletNode.AddToggle("Увімкнути", true)
const HpThreshold = ArmletNode.AddSlider("Поріг Здоров'я", 300, 50, 600, 10)

// Логіка роботи
EventsSDK.on("GameTick", () => {
    if (!IsEnabled.Value) return;

    const me = GameSDK.GetLocalPlayer(); 
    if (!me || !me.IsAlive()) return; 

    const armlet = ItemSDK.GetItemByName(me, "item_armlet"); 
    if (!armlet) return;

    const health = me.GetHealth(); 
    const isToggled = ItemSDK.IsToggled(armlet); 

    if (health <= HpThreshold.Value && isToggled) {
        ItemSDK.UseItem(armlet); // Вимкнути
        ItemSDK.UseItem(armlet); // Увімкнути
    }
});
