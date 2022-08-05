const { React } = require("powercord/webpack");
const {
  Category,
  SwitchItem,
  TextInput,
} = require("powercord/components/settings");

module.exports = class RPCSettings extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      settings: true,
      customize: false,
    };
  }

  render() {
    const { getSetting, updateSetting, toggleSetting } = this.props;

    let profileLink = `https://www.last.fm/user/${getSetting("username")}`;
    let profileNote = getSetting("username") ? (
      <a href={profileLink} target="_blank">
        {profileLink}
      </a>
    ) : (
      ""
    );

    return (
      <div>
        <Category
          name="Settings"
          description={"Change the main settings of the plugin"}
          opened={this.state.settings}
          onChange={(val) => this.setState({ settings: val })}
        >
          <SwitchItem
            value={getSetting("enabled")}
            onChange={() => toggleSetting("enabled")}
          >
            Enable Last.fm Rich Presence
          </SwitchItem>
          <TextInput
            value={getSetting("username")}
            required={true}
            onChange={(val) => updateSetting("username", val)}
            note={profileNote}
          >
            Last.fm Username
          </TextInput>
        </Category>
        <Category
          name="Customization"
          description={"Customize the rich presence activity"}
          opened={this.state.customize}
          onChange={(val) => this.setState({ customize: val })}
        >
          <TextInput
            value={getSetting("appName")}
            onChange={(val) => updateSetting("appName", val)}
            placeholder="Music"
            note="Suggestions: Music, Last.fm, iTunes, Apple Music"
          >
            Application Name
          </TextInput>
          <SwitchItem
            value={getSetting("shareName")}
            onChange={() => toggleSetting("shareName")}
            note="Also adds a link to your Last.fm profile"
          >
            Share Username
          </SwitchItem>
        </Category>
      </div>
    );
  }
};
