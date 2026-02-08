-- pfQuest French Localization

pfQuest.locale = pfQuest.locale or {}
pfQuest.locale.frFR = {
  ["Quest Tracker"] = "Traqueur de Quêtes",
  ["Quest Browser"] = "Navigateur de Quêtes",
  ["Configuration"] = "Configuration",
  ["Complete"] = "Terminé",
  ["In Progress"] = "En cours",
  ["Available"] = "Disponible",
  ["Level:"] = "Niveau:",
  ["Zone:"] = "Zone:",
  ["Objectives:"] = "Objectifs:",
  ["Quests:"] = "Quêtes:",
}

if GetLocale() == "frFR" then
  pfQuest.L = pfQuest.locale.frFR
end