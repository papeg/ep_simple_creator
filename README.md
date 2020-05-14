ep_simple_creator
=================
This plugin removes the input form for creating new pads with names and changes the create butten so the new pads have ids increasing from 0.

If two persons are creating simultaneously, they will be in the same pad.

Might break if you are adding more forms to the main page.

The path to single pads is now modifiable, add the following plugin-specific setting to your settings.json:

```json
  "ep_simple_creator": {
      "padPath": "p"
  },
```

