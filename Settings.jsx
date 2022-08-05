const { React } = require("powercord/webpack");
const { TextInput } = require("powercord/components/settings");

module.exports = class RPCSettings extends React.PureComponent {
  render() {
    const { getSetting, updateSetting, toggleSetting } = this.props;
    return (
      <div>
        <TextInput
          value={getSetting("username", "")}
          onChange={(val) => updateSetting("username", val)}
        >
          Username
        </TextInput>
      </div>
    );
  }
};
