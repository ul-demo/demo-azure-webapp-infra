import * as pulumi from "@pulumi/pulumi";
import * as azure from "@pulumi/azure";

const config = new pulumi.Config();
const projectName = pulumi.getProject();
const stackName = pulumi.getStack();

const objectName = `frpol9-${stackName}`;
const resourceGroupName = `${objectName}-rg`;
const appServicePlanName = `${objectName}-asp`;
const appServiceName = `${objectName}-app`;
const dockerImageTag = config.require("dockerImageTag");

const defaultTags = {
    "ApplicationName": projectName,
    "Env": stackName,
};

const resourceGroup = new azure.core.ResourceGroup(resourceGroupName, {
    name: resourceGroupName,
    tags: defaultTags
});

const appServicePlan = new azure.appservice.Plan(appServicePlanName, {
    name: appServicePlanName,
    resourceGroupName: resourceGroup.name,
    kind: "Linux",
    reserved: true,
    sku: {
        tier: "Basic",
        size: "B1",
    },
    tags: defaultTags,
}, {
    parent: resourceGroup
});

const appService = new azure.appservice.AppService(appServiceName, {
    name: appServiceName,
    siteConfig: {
        linuxFxVersion: `DOCKER|frpol9cacentral.azurecr.io/demo-azure-webapp:${dockerImageTag}`,
    },
    resourceGroupName: resourceGroup.name,
    appServicePlanId: appServicePlan.id,

    httpsOnly: true,
    appSettings: {
        DOCKER_REGISTRY_SERVER_URL: "https://frpol9cacentral.azurecr.io",
        DOCKER_REGISTRY_SERVER_USERNAME: "frpol9cacentral",
        DOCKER_REGISTRY_SERVER_PASSWORD: config.requireSecret("dockerRegistryPassword"),
        WEBSITES_ENABLE_APP_SERVICE_STORAGE: "false",
        WEBSITES_PORT: "8080"
    },

    tags: defaultTags,
});

export const appEndpoint = appService.defaultSiteHostname;