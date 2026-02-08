-- pfQuest English (US) Localization

pfQuest.locale = pfQuest.locale or {}
pfQuest.locale.enUS = {
  -- Interface strings
  ["Quest Tracker"] = "Quest Tracker",
  ["Quest Browser"] = "Quest Browser",
  ["Configuration"] = "Configuration",
  ["Search Quests:"] = "Search Quests:",
  ["Show Completed"] = "Show Completed",
  ["Show Low Level Quests"] = "Show Low Level Quests",
  ["Show Quest Nodes on Map"] = "Show Quest Nodes on Map",
  ["Enable Quest Tracker"] = "Enable Quest Tracker",
  
  -- Status messages
  ["Quest completed."] = "Quest completed.",
  ["Quest failed."] = "Quest failed.",
  ["Quest abandoned."] = "Quest abandoned.",
  ["Quest accepted."] = "Quest accepted.",
  
  -- Quest states
  ["Complete"] = "Complete",
  ["In Progress"] = "In Progress",
  ["Available"] = "Available",
  ["Unavailable"] = "Unavailable",
  ["In Log"] = "In Log",
  
  -- Command help
  ["Available commands:"] = "Available commands:",
  ["/pfquest config - Open configuration"] = "/pfquest config - Open configuration",
  ["/pfquest tracker - Toggle quest tracker"] = "/pfquest tracker - Toggle quest tracker",
  ["/pfquest browser - Show quest browser"] = "/pfquest browser - Show quest browser",
  ["/pfquest reset - Reset configuration"] = "/pfquest reset - Reset configuration",
  ["Configuration reset to defaults"] = "Configuration reset to defaults",
  
  -- Tooltips
  ["Left click: Open browser"] = "Left click: Open browser",
  ["Right click: Toggle tracker"] = "Right click: Toggle tracker",
  ["Enable/disable the quest tracker"] = "Enable/disable the quest tracker",
  
  -- Quest information
  ["Level:"] = "Level:",
  ["Zone:"] = "Zone:",
  ["Objectives:"] = "Objectives:",
  ["Quests:"] = "Quests:",
  ["Quest Item:"] = "Quest Item:",
  ["Unknown"] = "Unknown",
  ["Unknown Zone"] = "Unknown Zone",
  
  -- Distance
  ["< 10 yards"] = "< 10 yards",
  ["yards"] = "yards",
}

-- Set default locale
if GetLocale() == "enUS" or GetLocale() == "enGB" then
  pfQuest.L = pfQuest.locale.enUS
end