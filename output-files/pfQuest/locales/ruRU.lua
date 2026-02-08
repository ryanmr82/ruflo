-- pfQuest Russian Localization

pfQuest.locale = pfQuest.locale or {}
pfQuest.locale.ruRU = {
  ["Quest Tracker"] = "Отслеживание заданий",
  ["Quest Browser"] = "Обозреватель заданий",
  ["Configuration"] = "Конфигурация",
  ["Complete"] = "Завершено",
  ["In Progress"] = "В процессе",
  ["Available"] = "Доступно",
  ["Level:"] = "Уровень:",
  ["Zone:"] = "Зона:",
  ["Objectives:"] = "Цели:",
  ["Quests:"] = "Задания:",
}

if GetLocale() == "ruRU" then
  pfQuest.L = pfQuest.locale.ruRU
end