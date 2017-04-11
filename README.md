query-v1
========

Playing around with querying VersionOne programmatically.

## Running it Locally

You have to have node and npm installed, and npm install supervisor, locally.

### Get A V1 client_secrets.json File

To make OAuth work you need to create your own client_secrets.json file.

1. Log in to your instance of V1
2. Click on your name in the top right of the screen. Then click on "Member Details" in the drop down menu that appears.
3. Click on "Permitted Apps" in the top right of the pop-up screen.
4. Add a new "Web" application. Give it any name you like. Give it a callback URL like http://localhost:8088/auth/versionone/callback
5. Place the client_secrets.json file in the root of your clone of the repository. Never check it in. (The project's gitignore file should make this easy.)

### Run It

Once you have node, the code, and the OAuth setup then just run it from the terminal by going to the root of the project. Run the run_dev.sh script to launch the site locally.

Navigate to http://localhost:8088/

### UPDATE [April 10, 2017]: Add your Access Token

VersionOne has changed the way it does authentication. Now you go to your login and generate an access token for your own app.

    ╭──────────────────────────────────────────────╮
    │ ◎ ○ ○ ░░░░░░░░░░░ VERSIONONE ░░░░░░░░░░░░░░░░│
    ├──────────────────────────────────────────────┤
    │            (Hover) ────────────▶ UserName    │
    │                           ┌─────────────────┐│
    │                           │Member Details   ││
    │                           │Preferences      ││
    │                           │Password         ││
    │                           │Push Notificat...││
    │    (Select) ──────────────▶Applications     ││
    │                           │Timesheet        ││
    │                           │Logout           ││
    │                           └─────────────────┘│
    └──────────────────────────────────────────────┘

Click "Applications" on the menu that appears when you hover over your username.

    ╭──────────────────────────────────────────────╮
    │ ◎ ○ ○ ░░░░ V1 Member / Applications  ░░░░░░░░│
    ├──────────────────────────────────────────────┤
    │Applications to Add:                          │
    │ ◎ Public                                     │
    │ ◉ Personal                                   │
    │                                              │
    │Enter an application name:                    │
    │  ┌────────────────────────────────────────┐  │
    │  │          Make up a name here.          │  │
    │  └────────────────────────────────────────┘  │
    │  ┌───┐                                       │
    │  │Add│                                       │
    │  └───┘                                       │
    └──────────────────────────────────────────────┘

Select "Personal" application, make up a name for it, and click "Add." The site will generate an encoded token that you MUST keep track of from here on out.

To run the app locally you have to put that access token into your client_secrets.json file.

    {
      "web": {
        "server_base_uri": "https://www5.v1host.com/FH-V1"
      },
      "access_token": ">>>>YOUR ACCESS TOKEN HERE<<<<"
    }
