import { React } from "@cumcord/modules/common";
import { dependPersist, SSwitch, SText } from "cumcord-tools";
import { Card, FormTitle, FormText } from "./WPMODULES";
import { persist } from "@cumcord/pluginData";

export default dependPersist(() => (
  <div className="lastfm-settings-container">
    <Card type={Card.Types.PRIMARY} className="lastfm-status-card">
      <FormTitle tag={FormTitle.Tags.H1}>Status</FormTitle>
      <FormText className="lastfm-status" type={FormText.Types.DESCRIPTION}>
        {persist.ghost.status}
        <br />
        <small>(Updates every 5 seconds)</small>
      </FormText>
    </Card>
    <SSwitch k="enabled" depends={undefined}>
      Enable Last.fm Rich Presence
    </SSwitch>
    <SText k="username" depends="enabled">
      Last.fm Username
    </SText>
    <SText k="appName" depends="enabled">
      Application Name
    </SText>
    <SSwitch k="shareName" depends="enabled">
      Share Username
    </SSwitch>
  </div>
));
