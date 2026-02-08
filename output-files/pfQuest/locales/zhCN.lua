-- pfQuest Chinese Simplified Localization

pfQuest.locale = pfQuest.locale or {}
pfQuest.locale.zhCN = {
  ["Quest Tracker"] = "任务追踪器",
  ["Quest Browser"] = "任务浏览器",
  ["Configuration"] = "配置",
  ["Complete"] = "已完成",
  ["In Progress"] = "进行中",
  ["Available"] = "可用",
  ["Level:"] = "等级:",
  ["Zone:"] = "地区:",
  ["Objectives:"] = "目标:",
  ["Quests:"] = "任务:",
}

if GetLocale() == "zhCN" then
  pfQuest.L = pfQuest.locale.zhCN
end