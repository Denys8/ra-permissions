import React, { createElement, Component } from 'react';
import PropTypes from 'prop-types';
import FormField from 'react-admin/lib/mui/form/FormField';
import getContext from 'recompose/getContext';

import DefaultLoading from './Loading';
import { AUTH_GET_PERMISSIONS } from './constants';
import resolvePermissions from './resolvePermissions';

export class SwitchPermissionsComponent extends Component {
    static propTypes = {
        authClient: PropTypes.func,
        authClientFromContext: PropTypes.func,
        children: PropTypes.node.isRequired,
        notFound: PropTypes.func,
        loading: PropTypes.func,
        record: PropTypes.object,
        resource: PropTypes.string,
    };

    static defaultProps = {
        notFound: null,
        loading: DefaultLoading,
    };

    state = {
        isNotFound: false,
        match: undefined,
        role: undefined,
    };

    async componentWillMount() {
        const { authClient, authClientFromContext, children, record, resource } = this.props;
        const mappings =
            React.Children.map(children, ({ props: { value, resolve, children, exact } }) => ({
                permissions: value,
                resolve,
                view: children,
                exact,
            })) || [];

        const finalAuthClient = authClient || authClientFromContext;

        const permissions = await finalAuthClient(AUTH_GET_PERMISSIONS, { record, resource });
        const match = await resolvePermissions({ mappings, permissions, record, resource });

        if (match) {
            this.setState({ match: match.view });
        } else {
            this.setState({ isNotFound: true, permissions });
        }
    }

    renderSourceChild = (child, props) =>
        <div key={child.props.source} style={child.props.style} className={`aor-input-${child.props.source}`}>
            <FormField input={child} {...props} />
        </div>;

    render() {
        const { isNotFound, match, role } = this.state;
        const { authClient, authClientFromContext, children, notFound, loading, ...props } = this.props;

        if (isNotFound) {
            if (notFound) {
                return createElement(notFound, { role });
            }
            return null;
        }

        if (!match) {
            return createElement(loading);
        }

        if (Array.isArray(match)) {
            return (
                <div>
                    {React.Children.map(
                        match,
                        child =>
                            child.props.source ? this.renderSourceChild(child) : <FormField input={child} {...props} />,
                    )}
                </div>
            );
        }

        return match.props.source ? this.renderSourceChild(match) : <FormField input={match} {...props} />;
    }
}

export default getContext({
    authClientFromContext: PropTypes.func,
})(SwitchPermissionsComponent);
