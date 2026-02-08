-- pfQuest German Localization

pfQuest.locale = pfQuest.locale or {}
pfQuest.locale.deDE = {
  -- Basic German translations
  ["Quest Tracker"] = "Quest Verfolger",
  ["Quest Browser"] = "Quest Browser",
  ["Configuration"] = "Konfiguration",
  ["Search Quests:"] = "Quests suchen:",
  ["Show Completed"] = "Abgeschlossene anzeigen",
  ["Complete"] = "Abgeschlossen",
  ["In Progress"] = "In Bearbeitung",
  ["Available"] = "Verfügbar",
  ["Level:"] = "Stufe:",
  ["Zone:"] = "Zone:",
  ["Objectives:"] = "Ziele:",
  ["Quests:"] = "Quests:",
}

if GetLocale() == "deDE" then
  pfQuest.L = pfQuest.locale.deDE
end