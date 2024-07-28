local config = Config


local function handleNuiCallback(callbackName, cb)
    Wait(0)
    TriggerEvent('hud:client:playHudChecklistSound')
    saveSettings()
    cb('ok')
end

local nuiCallbacks = {
    showOutCompass = true,
    showFollowCompass = true,
    showCompassBase = true,
    showStreetsNames = true,
    showPointerIndex = true,
    showDegreesNum = true,
    changeCompassFPS = true,
}

for callbackName, _ in pairs(nuiCallbacks) do
    RegisterNUICallback(callbackName, function(_, cb)
        handleNuiCallback(callbackName, cb)
    end)
end


function round(num, numDecimalPlaces)
    local mult = 10 ^ (numDecimalPlaces or 0)
    return math.floor(num * mult + 0.5) / mult
end

local prevBaseplateStats = { nil, nil, nil, nil, nil, nil, nil }

local function updateBaseplateHud(data)
    local shouldUpdate = false
    for k, v in pairs(data) do
        if prevBaseplateStats[k] ~= v then
            shouldUpdate = true
            break
        end
    end
    prevBaseplateStats = data
    if shouldUpdate then
        SendNUIMessage({
            action = 'baseplate',
            show = data[1],
            street1 = data[2],
            street2 = data[3],
            showCompass = data[4],
            showStreets = data[5],
            showPointer = data[6],
            showDegrees = data[7],
        })
    end
end

local lastCrossroadUpdate = 0
local lastCrossroadCheck = {}

local function getCrossroads(player)
    local updateTick = GetGameTimer()
    if updateTick - lastCrossroadUpdate > config.StreetUpdateInterval then
        local pos = GetEntityCoords(player)
        local street1, street2 = GetStreetNameAtCoord(pos.x, pos.y, pos.z)
        lastCrossroadUpdate = updateTick
        lastCrossroadCheck = { GetStreetNameFromHashKey(street1), GetStreetNameFromHashKey(street2) }
    end
    return lastCrossroadCheck
end


CreateThread(function()
    local lastHeading = 1
    while true do
        local player = PlayerPedId()
        if IsPedInAnyVehicle(player, false) then
            local heading = round(360.0 - GetEntityHeading(player))
            if heading == 360 then heading = 0 end
            if heading ~= lastHeading then
                local crossroads = getCrossroads(player)
                SendNUIMessage({
                    action = 'update',
                    value = tostring(heading)
                })
                updateBaseplateHud({
                    true, 
                    crossroads[1],
                    crossroads[2],
                    true, 
                    true, 
                    true, 
                    true, 
                })
                lastHeading = heading
            end
            Wait(config.HeadingUpdateInterval) 
        else
            Wait(500) 
        end
    end
end)

CreateThread(function()
    while true do
        local player = PlayerPedId()
        if IsPedInAnyVehicle(player, false) then
            TriggerEvent('playerEnteredVehicle')
        else
            TriggerEvent('playerExitedVehicle')
        end
        Wait(1000) 
    end
end)

RegisterNetEvent('playerEnteredVehicle', function()
    local player = PlayerPedId()
    local heading = round(360.0 - GetEntityHeading(player))
    if heading == 360 then heading = 0 end
    local crossroads = getCrossroads(player)
    SendNUIMessage({
        action = 'update',
        value = tostring(heading)
    })
    updateBaseplateHud({
        true, 
        crossroads[1],
        crossroads[2],
        true, 
        true, 
        true, 
        true, 
    })
end)

RegisterNetEvent('playerExitedVehicle', function()
    updateBaseplateHud({
        false, 
        "", 
        "", 
        false, 
        false, 
        false, 
        false, 
    })
end)
