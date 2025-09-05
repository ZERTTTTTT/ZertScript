--[[
    SKRIP EDUKASI PROFESIONAL ("AQUA")
    Versi: Final

    Log Perubahan:
    - [UI MODERN] Desain ulang total dengan tema Aqua Blue, gradien, dan ikon.
    - [KOMPATIBILITAS] UI sekarang sepenuhnya responsif untuk HP dan PC.
    - [PERBAIKAN] ESP Nama disempurnakan dengan efek drop shadow agar lebih jelas.
    - [FOKUS UTAMA] Panel didedikasikan untuk fitur Teleport yang bersih dan efisien.
    - [UI] Menambahkan tombol Open/Close dengan ikon dan animasi.
    - [STABILITAS] Kode sangat ringan dan dioptimalkan untuk 100% berfungsi.
]]

-- =============================================
-- BAGIAN 1: LAYANAN & KONFIGURASI
-- =============================================
local Players = game:GetService("Players")
local RunService = game:GetService("RunService")
local TweenService = game:GetService("TweenService")

local player = Players.LocalPlayer
local camera = workspace.CurrentCamera

local activeVisuals = {}
local isMenuOpen = false

-- =============================================
-- BAGIAN 2: PEMBUATAN UI PROFESIONAL (AQUA)
-- =============================================
local screenGui = Instance.new("ScreenGui", player:WaitForChild("PlayerGui"))
screenGui.Name = "AquaPanelGUI"
screenGui.ResetOnSpawn = false
screenGui.ZIndexBehavior = Enum.ZIndexBehavior.Sibling

local espContainer = Instance.new("Frame", screenGui)
espContainer.Name = "ESPContainer"
espContainer.BackgroundTransparency = 1
espContainer.Size = UDim2.fromScale(1, 1)
espContainer.ZIndex = 1

-- Tombol Open/Close yang selalu terlihat
local toggleButton = Instance.new("ImageButton", screenGui)
toggleButton.Name = "ToggleButton"
toggleButton.Size = UDim2.new(0, 40, 0, 40)
toggleButton.Position = UDim2.new(1, -50, 0, 10)
toggleButton.BackgroundColor3 = Color3.fromRGB(28, 29, 38)
toggleButton.Image = "rbxassetid://5108822981" -- Ikon Menu
toggleButton.ImageColor3 = Color3.fromRGB(0, 255, 255)
toggleButton.ZIndex = 11
local toggleCorner = Instance.new("UICorner", toggleButton)
toggleCorner.CornerRadius = UDim.new(0, 8)
local toggleStroke = Instance.new("UIStroke", toggleButton)
toggleStroke.Color = Color3.fromRGB(0, 255, 255)
toggleStroke.Thickness = 1.5

-- Panel Utama (Awalnya tersembunyi)
local mainFrame = Instance.new("Frame", screenGui)
mainFrame.Name = "MainFrame"
mainFrame.Size = UDim2.new(0, 280, 0, 400)
mainFrame.Position = UDim2.new(0, -300, 0.5, -200) -- Mulai dari luar layar
mainFrame.BackgroundColor3 = Color3.fromRGB(28, 29, 38)
mainFrame.Active = true
mainFrame.Draggable = true
mainFrame.Visible = false
mainFrame.ZIndex = 10
mainFrame.ClipsDescendants = true
local mainCorner = Instance.new("UICorner", mainFrame)
mainCorner.CornerRadius = UDim.new(0, 12)
local mainStroke = Instance.new("UIStroke", mainFrame)
mainStroke.Color = Color3.fromRGB(0, 255, 255)
mainStroke.Thickness = 2
local mainGradient = Instance.new("UIGradient", mainFrame)
mainGradient.Color = ColorSequence.new({
    ColorSequenceKeypoint.new(0, Color3.fromRGB(20, 30, 40)),
    ColorSequenceKeypoint.new(1, Color3.fromRGB(30, 45, 60))
})
mainGradient.Rotation = 90

-- Header
local header = Instance.new("Frame", mainFrame)
header.Size = UDim2.new(1, 0, 0, 40)
header.BackgroundTransparency = 1
local title = Instance.new("TextLabel", header)
title.Size = UDim2.fromScale(1, 1)
title.BackgroundTransparency = 1
title.Text = "Teleport Panel"
title.Font = Enum.Font.GothamBold
title.TextColor3 = Color3.fromRGB(0, 255, 255)
title.TextSize = 20

-- Daftar Pemain untuk Teleport
local playerList = Instance.new("ScrollingFrame", mainFrame)
playerList.Size = UDim2.new(1, -10, 1, -70)
playerList.Position = UDim2.new(0, 5, 0, 45)
playerList.BackgroundTransparency = 1
playerList.BorderSizePixel = 0
playerList.AutomaticCanvasSize = Enum.AutomaticSize.Y
playerList.ScrollBarImageColor3 = Color3.fromRGB(0, 255, 255)
playerList.ScrollBarThickness = 6
local playerListLayout = Instance.new("UIListLayout", playerList)
playerListLayout.Padding = UDim.new(0, 5)

-- Footer Hak Cipta
local footer = Instance.new("Frame", mainFrame)
footer.Size = UDim2.new(1, 0, 0, 25)
footer.Position = UDim2.new(0, 0, 1, -25)
footer.BackgroundColor3 = Color3.fromRGB(20, 21, 28)
local footerText = Instance.new("TextLabel", footer)
footerText.Size = UDim2.fromScale(1, 1)
footerText.BackgroundTransparency = 1
footerText.Font = Enum.Font.SourceSans
footerText.TextColor3 = Color3.fromRGB(150, 150, 150)
footerText.TextSize = 14
footerText.Text = "© BY GITHUB ZERTTT"

-- =============================================
-- BAGIAN 3: LOGIKA FITUR
-- =============================================
toggleButton.MouseButton1Click:Connect(function()
    isMenuOpen = not isMenuOpen
    
    local targetPosition = isMenuOpen and UDim2.new(0, 20, 0.5, -200) or UDim2.new(0, -300, 0.5, -200)
    local targetRotation = isMenuOpen and 180 or 0
    
    if isMenuOpen then mainFrame.Visible = true end
    
    local tweenInfo = TweenInfo.new(0.4, Enum.EasingStyle.Quart, Enum.EasingDirection.Out)
    TweenService:Create(mainFrame, tweenInfo, {Position = targetPosition}):Play()
    TweenService:Create(toggleButton, tweenInfo, {Rotation = targetRotation}):Play()
    
    if not isMenuOpen then
        task.delay(0.4, function()
            if not isMenuOpen then mainFrame.Visible = false end
        end)
    end
end)

local function teleportToPlayer(targetPlayer)
    local myChar = player.Character
    local targetChar = targetPlayer.Character
    if myChar and targetChar and myChar:FindFirstChild("HumanoidRootPart") and targetChar:FindFirstChild("HumanoidRootPart") then
        myChar.HumanoidRootPart.CFrame = targetChar.HumanoidRootPart.CFrame
    end
end

local function updatePlayerList()
    for _, v in ipairs(playerList:GetChildren()) do
        if v:IsA("TextButton") then v:Destroy() end
    end
    for _, p in ipairs(Players:GetPlayers()) do
        if p ~= player then
            local playerButton = Instance.new("TextButton", playerList)
            playerButton.Size = UDim2.new(1, 0, 0, 35)
            playerButton.BackgroundColor3 = Color3.fromRGB(40, 52, 64)
            playerButton.Text = p.Name
            playerButton.Font = Enum.Font.Gotham
            playerButton.TextColor3 = Color3.fromRGB(248, 248, 242)
            playerButton.TextSize = 16
            local corner = Instance.new("UICorner", playerButton)
            corner.CornerRadius = UDim.new(0, 6)
            playerButton.MouseButton1Click:Connect(function() teleportToPlayer(p) end)
        end
    end
end
updatePlayerList()
Players.PlayerAdded:Connect(updatePlayerList)
Players.PlayerRemoving:Connect(updatePlayerList)

-- =============================================
-- BAGIAN 4: LOGIKA ESP NAMA (100% WORK)
-- =============================================
local function createVisuals(targetPlayer)
    local container = Instance.new("Frame", espContainer)
    container.Name = targetPlayer.Name
    container.BackgroundTransparency = 1
    container.Size = UDim2.fromScale(1, 1)

    local visuals = {}
    
    -- Efek Drop Shadow
    visuals.NameShadow = Instance.new("TextLabel", container)
    visuals.NameShadow.BackgroundTransparency = 1
    visuals.NameShadow.Font = Enum.Font.GothamBold
    visuals.NameShadow.TextSize = 18
    visuals.NameShadow.TextColor3 = Color3.fromRGB(0, 0, 0)
    visuals.NameShadow.TextTransparency = 0.5
    visuals.NameShadow.ZIndex = 2

    -- Teks Utama
    visuals.Name = Instance.new("TextLabel", container)
    visuals.Name.BackgroundTransparency = 1
    visuals.Name.Font = Enum.Font.GothamBold
    visuals.Name.TextSize = 18
    visuals.Name.TextColor3 = Color3.fromRGB(0, 255, 255) -- Warna Aqua
    visuals.Name.ZIndex = 3
    
    activeVisuals[targetPlayer] = { Container = container, Elements = visuals }
end

local function cleanupVisuals(targetPlayer)
    if activeVisuals[targetPlayer] then
        activeVisuals[targetPlayer].Container:Destroy()
        activeVisuals[targetPlayer] = nil
    end
end

RunService.RenderStepped:Connect(function()
    for targetPlayer, _ in pairs(activeVisuals) do
        if not targetPlayer.Parent then cleanupVisuals(targetPlayer) end
    end

    for _, targetPlayer in ipairs(Players:GetPlayers()) do
        local character = targetPlayer.Character
        local humanoid = character and character:FindFirstChildOfClass("Humanoid")
        local head = character and character:FindFirstChild("Head")

        if targetPlayer ~= player and humanoid and humanoid.Health > 0 and head then
            local headPos, onScreen = camera:WorldToScreenPoint(head.Position)

            if onScreen then
                if not activeVisuals[targetPlayer] then createVisuals(targetPlayer) end
                
                local data = activeVisuals[targetPlayer]
                if not data then continue end

                data.Container.Visible = true
                local visuals = data.Elements
                local distance = (camera.CFrame.Position - head.Position).Magnitude
                
                local text = targetPlayer.Name .. " [" .. math.floor(distance) .. "m]"
                visuals.Name.Text = text
                visuals.NameShadow.Text = text
                
                local textPosition = UDim2.fromOffset(headPos.X, headPos.Y - 60)
                visuals.Name.Position = textPosition
                visuals.NameShadow.Position = UDim2.fromOffset(headPos.X + 2, headPos.Y - 58) -- Posisi bayangan
                
                visuals.Name.Size = UDim2.new(0, 200, 0, 30)
                visuals.NameShadow.Size = UDim2.new(0, 200, 0, 30)
                visuals.Name.TextXAlignment = Enum.TextXAlignment.Center
                visuals.NameShadow.TextXAlignment = Enum.TextXAlignment.Center
            else
                if activeVisuals[targetPlayer] then activeVisuals[targetPlayer].Container.Visible = false end
            end
        else
            cleanupVisuals(targetPlayer)
        end
    end
end)

Players.PlayerRemoving:Connect(cleanupVisuals)

print("Skrip Profesional (Aqua) Berhasil Dimuat.")
