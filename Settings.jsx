const { React } = require("powercord/webpack");
const { SwitchItem, TextInput } = require("powercord/components/settings");

module.exports = class RPCSettings extends React.PureComponent {
  render() {
    const { getSetting, updateSetting, toggleSetting } = this.props;
    return (
      <div>
        <SwitchItem
          value={getSetting("enabled")}
          onChange={() => toggleSetting("enabled")}
        >
          Enabled
        </SwitchItem>
        <TextInput
          value={getSetting("username", "")}
          required={true}
          onChange={(val) => updateSetting("username", val)}
        >
          Username
        </TextInput>
      </div>
    );
  }
};
