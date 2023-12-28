import React from 'react';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import ModelSelectIcon from '@mui/icons-material/AssignmentInd';
import {Menu} from "@mui/material";
import Tooltip from "@mui/material/Tooltip";

export const ModelTypes = [
    {
        name: 'gpt-3.5-turbo',
        title: 'GPT 3.5 Turbo',
        help: 'Fast and reliable, but with world information (up to Sep 2021).'
    },
    {
        name: 'gpt-3.5-turbo-1106',
        title: 'GPT 3.5 Turbo (updated)',
        help: 'The latest version of GPT 3.5 Turbo, with many improvements.'
    },
    {
        name: 'gpt-3.5-turbo-16k',
        title: 'GPT 3.5 Turbo (16k)',
        help: 'The same as GPT 3.5 Turbo, but with 16k tokens.'
    },
    {
        name: 'gpt-4-1106-preview',
        title: 'GPT 4 (preview)',
        help: 'The latest GPT-4 model, with many improvements, but still in preview and may be very slow.'
    },
    {
        name: 'gpt-4',
        title: 'GPT 4',
        help: 'The default GPT-4 model is smarter than GPT-3, but it supports fewer tokens and may be slower.'
    },
];

export const SelectModelDropdown = React.forwardRef(function SelectModelDropdown(props, ref) {
    const {onChange, currentModel = 'docs', ...rest} = props || {};
    const [model, setModel] = React.useState(currentModel);
    const handleChange = (event) => {
        setModel(event.target.value);
    };
    React.useEffect(() => {
        if (model && onChange) {
            onChange(model);
        }
    }, [model, onChange]);
    return (
        <Select
            ref={ref}
            variant="outlined"
            onChange={handleChange}
            defaultValue={model}
            {...rest}
        >
            {ModelTypes.map(({name, title}) => (
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

export const SelectModelButtonIconMenu = React.forwardRef(function SelectModelButtonIconMenu(props, ref) {
    const {onChange, currentModel = 'docs', ...rest} = props || {};
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
                id="select-model-button"
                aria-controls={open ? 'basic-menu' : undefined}
                aria-haspopup="true"
                aria-expanded={open ? 'true' : undefined}
                onClick={handleClick}
                {...rest}
            >
                <ModelSelectIcon/>
            </IconButton>
            <Menu
                id="select-model-menu"
                open={open}
                anchorEl={anchorEl}
                onClose={handleClose}
                MenuListProps={{
                    'aria-labelledby': 'select-model-button',
                }}
            >
                {ModelTypes.map(({name, title, help}) => (
                    <Tooltip title={help} key={name}>
                        <MenuItem
                            selected={name === currentModel}
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

export default SelectModelDropdown;