const pulumi = require("@pulumi/pulumi");
const aws = require("@pulumi/aws");

// Create a VPC.
const vpc = new aws.ec2.Vpc("vpc", {
    cidrBlock: "10.0.0.0/16",
});

// Create an an internet gateway.
const gateway = new aws.ec2.InternetGateway("gateway", {
    vpcId: vpc.id,
});

// Create a subnet that automatically assigns new instances a public IP address.
const subnet = new aws.ec2.Subnet("subnet", {
    vpcId: vpc.id,
    cidrBlock: "10.0.1.0/24",
    mapPublicIpOnLaunch: true,
});

// Create a route table.
const routes = new aws.ec2.RouteTable("routes", {
    vpcId: vpc.id,
    routes: [
        {
            cidrBlock: "0.0.0.0/0",
            gatewayId: gateway.id,
        },
    ],
});

// Associate the route table with the public subnet.
const routeTableAssociation = new aws.ec2.RouteTableAssociation("route-table-association", {
    subnetId: subnet.id,
    routeTableId: routes.id,
});

// Create a security group allowing inbound access over port 80 and outbound
// access to anywhere.
const securityGroup = new aws.ec2.SecurityGroup("security-group", {
    vpcId: vpc.id,
    ingress: [
        { protocol: "tcp", fromPort: 22, toPort: 22, cidrBlocks: ["0.0.0.0/0"] },
        { protocol: "tcp", fromPort: 80, toPort: 80, cidrBlocks: ["0.0.0.0/0"] },
    ],
    egress: [
        {
            cidrBlocks: [ "0.0.0.0/0" ],
            fromPort: 0,
            toPort: 0,
            protocol: "-1",
        },
    ],
});

// Find the latest Amazon Linux 2 AMI.
const ami = pulumi.output(aws.ec2.getAmi({
    owners: [ "amazon" ],
    mostRecent: true,
    filters: [
        { name: "description", values: [ "Amazon Linux 2 *" ] },
    ],
}));

// Create and launch an Amazon Linux EC2 instance into the public subnet.
const instance = new aws.ec2.Instance("instance", {
    tags: { "Name": "web-server-www" },
    ami: ami.id,
    instanceType: "t2.micro",
    subnetId: subnet.id,
    vpcSecurityGroupIds: [
        securityGroup.id,
    ],
});

module.exports = {
    instanceURL: pulumi.interpolate `http://${instance.publicIp}`,
};
