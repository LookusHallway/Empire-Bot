## Empire Bot
This bot was originally intended for use in SMP servers. It allows users to create empires with a unique name and description, invite players and give them roles, view relevant information, set flags, etc. All information for empires are stored in RethinkDB. Below is a list of full commands.
### Commands
=empire Creates a new empire
=description [description] View the description of your current empire or update it (updating requires Co-Owner or above)
=player [name] View information about a player (empire, online status, last login etc)
=promote [name] [trial/member/officer/co] Promote someone within your SMP empire
=kick [name] Kick a player from your empire (requires Officer or above)
=invite [name] Invite a player to your empire (requires Officer or above)
=transfer [name] Transfer your empire to another player
=disband Disband your empire, this will make everyone in your empire have no empire!
=rename [name] Change your empire name to another name
=flags [flag] [on/off] Change your empires flags (e.g. passive mode)