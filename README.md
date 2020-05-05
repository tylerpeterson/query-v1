query-v1
========

Playing around with querying VersionOne programmatically.

## Running it Locally

You have to have node and npm installed, and npm install supervisor, locally. You only need supervisor for running it, you don't need to run npm install.

### Get A V1 Access Token

To make the V1 api work you need to create your own access token.

Log-in to V1 and generate an access token for your own app.

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

To run the app locally, create a client_secrets.json file in the root of your project, and put the access token into that file.

    {
      "v1AccessToken": ">>>>YOUR ACCESS TOKEN HERE<<<<"
    }

### Run It

Once you have node, the code, and V1 access setup then just run it from the terminal by going to the root of the project. Run the run_dev.sh script to launch the site locally.

Navigate to http://localhost:8088/

To change your local settings edit .env_dev
