import { LogLevel } from "@azure/msal-browser"; //MIT LICENSE < https://github.com/AzureAD/microsoft-authentication-library-for-js >

export const msalConfig = {
  auth: {
    clientId: "0fa38708-b7d4-4600-bc07-2b1b6a329e4e", // e.g. "70258689-8a4e-410f-a300-cb2011f23cf3"
    authority: "https://login.windows.net/9bccba71-9d01-4474-bae1-d55da0d9b8f6", //e.g. "https://login.windows.net/4d67e6d4-78f7-438b-8e40-7e408dcfa0ca"
    redirectUri: "https://wufb-ds.tplant.com.au",
  },
  cache: {
    cacheLocation: "sessionStorage",
    storeAuthStateInCookie: false,
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) {
          return;
        }
        switch (level) {
          case LogLevel.Error:
            console.error(message);
            return;
        }
      },
    },
  },
};

export const wufbRequest = {
  scopes: [
    "00000003-0000-0000-c000-000000000000/WindowsUpdates.ReadWrite.All",
    "User.Read",
  ],
};

export const userFeedbackRequest = {
  scopes: ["User.Read"],
};
