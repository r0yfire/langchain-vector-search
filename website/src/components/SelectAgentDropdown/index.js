import React from 'react';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import AgentSelectIcon from '@mui/icons-material/Settings';
import {Menu} from "@mui/material";
import Tooltip from "@mui/material/Tooltip";

export const AgentTypes = [
    {
        name: 'docs',
        title: 'Documentation Agent',
        help: 'This agent has access to all public documentation and can help with general questions.'
    },
    {
        name: 'slack',
        title: 'Slack Agent',
        help: 'This agent has access to most internal Slack messages and can help with general questions.'
    },
    {
        name: 'notion',
        title: 'Notion Agent',
        help: 'This agent has access to most internal Notion pages and can help with general questions.',
    },
    {
        name: 'pirate',
        title: 'Pirate Agent',
        help: 'Documentation agent, but with a pirate accent.'
    },
];

export const SelectAgentDropdown = React.forwardRef(function SelectAgentDropdown(props, ref) {
    const {onChange, currentAgent = 'docs', ...rest} = props || {};
    const [agent, setAgent] = React.useState(currentAgent);
    const handleChange = (event) => {
        setAgent(event.target.value);
    };
    React.useEffect(() => {
        if (agent && onChange) {
            onChange(agent);
        }
    }, [agent, onChange]);
    return (
        <Select
            ref={ref}
            variant="outlined"
            onChange={handleChange}
            defaultValue={agent}
            {...rest}
        >
            {AgentTypes.map(({name, title}) => (
                <MenuItem
                    key={name}
                    value={name}
                >
                    {title}
                </MenuItem>
            ))}
        </Select>
    );
});

export const SelectAgentButtonIconMenu = React.forwardRef(function SelectAgentButtonIconMenu(props, ref) {
    const {onChange, currentAgent = 'docs', ...rest} = props || {};
    const [anchorEl, setAnchorEl] = React.useState(null);
    const open = Boolean(anchorEl);
    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
    };
    const handleChange = (agentName) => {
        handleClose();
        if (onChange) {
            onChange(agentName);
        }
    };
    return (
        <React.Fragment>
            <IconButton
                ref={ref}
                id="select-agent-button"
                aria-controls={open ? 'basic-menu' : undefined}
                aria-haspopup="true"
                aria-expanded={open ? 'true' : undefined}
                onClick={handleClick}
                {...rest}
            >
                <AgentSelectIcon/>
            </IconButton>
            <Menu
                id="select-agent-menu"
                open={open}
                anchorEl={anchorEl}
                onClose={handleClose}
                MenuListProps={{
                    'aria-labelledby': 'select-agent-button',
                }}
            >
                {AgentTypes.map(({name, title, help}) => (
                    <Tooltip title={help} key={name}>
                        <MenuItem
                            selected={name === currentAgent}
                            onClick={() => handleChange(name)}
                        >
                            {title}
                        </MenuItem>
                    </Tooltip>
                ))}
            </Menu>
        </React.Fragment>
    );
});

export default SelectAgentDropdown;