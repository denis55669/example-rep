nst spells = Me.Abilities.filter(a => 
            (a.Name.includes("warcry")  a.Name.includes("anchor_smash")  a.Name.includes("gods_strength")  a.Name.includes("ravage")) 
            && a.CanBeCasted() && a.ManaCost <= Me.Mana
        );

        for (const s of spells) {
            // @ts-ignore
            Me.CastNoTarget(s);
            Sleeper.Sleep(2000, "cast_spell"); // Пауза щоб не спамив
            break;
        }
    }

    // 5. ДВИЖЕНИЕ (ТВІЙ РОБОЧИЙ МЕТОД + РОТАЦІЯ)
    if (now - lastMoveTick >= 3000) {
        lastMoveTick = now;
        const isRadiant = LocalPlayer.Team === 2;
        const spots = isRadiant ? RAD_SPOTS : DIRE_SPOTS;
        
        let target: Vector3;

        // ПЕРЕВІРКА НА 10 СМЕРТЕЙ
        // @ts-ignore
        if (Me.Deaths >= 10) {
            target = spots.JUNGLE.Clone();
            target.x += (Math.random() * 1000 - 500); // Гуляємо по лісу
            target.y += (Math.random() * 1000 - 500);
            try {
                // @ts-ignore
                Me.MoveTo(target);
            } catch (e) {}
            return; // Виходимо, щоб не йти на лінію
        }

        // ЦИКЛ ЛІНІЙ: Змінюємо лінію кожні 2 рівні
        // 1-2 -> Bot, 3-4 -> Mid, 5-6 -> Top, 7-8 -> Bot
        const cycle = Math.floor((Me.Level - 1) / 2) % 3;
        
        const isHideLevel = (Me.Level % 2 !== 0); // 1, 3, 5... (Ховаємось)

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
                // ПУШ (Четные уровни): Атака в землю (A-click)
                // @ts-ignore
                Me.Attack(target); 
            } else {
                // КУСТЫ (Нечетные уровни): Bypass в нычку
                // @ts-ignore
                Me.MoveTo(target, false, true); 
            }
        } catch (e) {
            // @ts-ignore
            Me.MoveTo(target);
        }
    }
});
