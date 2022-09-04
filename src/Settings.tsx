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
  </div>
));
