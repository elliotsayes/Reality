-- Name: LlamaCaptain
-- PID: CJcM_n0-s3gtt_Xqcffu5-AseTFARioG7iK4B3myeU4

local json = require('json')

BOATMASTER_PID = "FdDJu16cgYE4KAT07jXtxvukntAE3JZaE3WrNnAjGis"

WARP_CURRENT = WARP_CURRENT or {
  Name = 'PalmIsland',
  PID = 'OqvzTvpHYrfswvVZdsSldVTNBnyBOk7kZf-oqDdvUjg',
}

Handlers.add(
  'Schema',
  Handlers.utils.hasMatchingTag('Action', 'Schema'),
  function(msg)
    print('Schema')
    Send({
      Target = msg.From,
      Tags = { Type = 'Schema' },
      Data = json.encode({
        Sail = {
          Title = 'Ready to set sail?',
          Description = 'Last I heard, we were headed to ' ..
              WARP_CURRENT.Name .. '. Jump aboard and we\'ll be on our way!',
          Schema = nil,
        },
      })
    })
  end
)

Handlers.add(
  'WarpCurrentResponse',
  Handlers.utils.hasMatchingTag('Action', 'WarpCurrent'),
  function(msg)
    print('WarpCurrent')

    if (msg.From ~= BOATMASTER_PID) then
      return print('Unauthorized')
    end

    WARP_CURRENT.Name = msg.Tags.WarpName
    WARP_CURRENT.PID = msg.Tags.WarpPID
  end
)

Handlers.add(
  'CronTick',
  Handlers.utils.hasMatchingTag('Action', 'Cron'),
  function(msg)
    print('CronTick')
    Send({
      Target = BOATMASTER_PID,
      Tags = {
        Action = 'WarpCurrent',
      },
    })
  end
)
