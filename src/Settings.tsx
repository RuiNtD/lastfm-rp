import { React } from "@cumcord/modules/common";
import { dependPersist, SSwitch, SText } from "cumcord-tools";
import { Card, FormTitle, FormText } from "./WPMODULES";
import { persist } from "@cumcord/pluginData";

export default dependPersist(() => (
  <div className="lastfm-settings-container">
    <Card type={Card.Types.PRIMARY} className="lastfm-status-card">
      <FormTitle tag={FormTitle.Tags.H1}>Current Status</FormTitle>
      <FormText className="lastfm-status" type={FormText.Types.DESCRIPTION}>
        <div className="updatesEvery">(Updates every 5 seconds)</div>
        <div className="status">{persist.ghost.status}</div>
      </FormText>
    </Card>
    <SText k="username">Last.fm Username</SText>
    <SText k="appName">Application Name</SText>
    <SSwitch k="shareName">Share Username</SSwitch>
    <SSwitch k="otherEnabled">
      Disable when another player's Rich Presence is detected
    </SSwitch>
    <SSwitch k="otherListening" depends="otherEnabled">
      "Listening to" status (Spotify)
    </SSwitch>
    <SSwitch k="otherCider" depends="otherEnabled">
      <a href="https://cider.sh/" target="_blank">
        Cider
      </a>{" "}
      (Apple Music)
    </SSwitch>
    <SSwitch k="otheriTRP" depends="otherEnabled">
      <a href="https://itunesrichpresence.com/" target="_blank">
        iTunes Rich Presence
      </a>
    </SSwitch>
    <SSwitch k="otherAMPMD" depends="otherEnabled">
      <a
        href="https://premid.app/store/presences/Apple%20Music"
        target="_blank"
      >
        Apple Music PreMiD
      </a>
    </SSwitch>
  </div>
));
