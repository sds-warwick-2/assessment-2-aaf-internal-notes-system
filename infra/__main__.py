import pulumi
import pulumi_aws as aws

vpc = aws.ec2.Vpc(
	"ec2-vpc",
	cidr_block="10.0.0.0/16"
)

public_subnet = aws.ec2.Subnet(
	"ec2-public-subnet",
	cidr_block="10.0.101.0/24",
	tags={
		"Name": "ec2-public"
	},
	vpc_id=vpc.id
)

igw = aws.ec2.InternetGateway(
	"ec2-igw",
	vpc_id=vpc.id,
)

route_table = aws.ec2.RouteTable(
	"ec2-route-table",
	vpc_id=vpc.id,
	routes=[
		{
			"cidr_block": "0.0.0.0/0",
			"gateway_id": igw.id
		}
	]
)

rt_assoc = aws.ec2.RouteTableAssociation(
	"ec2-rta",
	route_table_id=route_table.id,
	subnet_id=public_subnet.id
)

sg = aws.ec2.SecurityGroup(
	"ec2-http-sg",
	description="Allow HTTP traffic to EC2 instance",
    ingress=[
        { 'protocol': 'tcp', 'from_port': 80, 'to_port': 80, 'cidr_blocks': ['0.0.0.0/0'] },
        { 'protocol': 'tcp', 'from_port': 22, 'to_port': 22, 'cidr_blocks': ['0.0.0.0/0'] }
    ],
    egress=[
        { 'protocol': '-1', 'from_port': 0, 'to_port': 0, 'cidr_blocks': ['0.0.0.0/0'] }
    ],
    vpc_id=vpc.id,
)

ami = aws.ec2.get_ami(
	most_recent="true",
	owners=["amazon"],
	filters=[{"name": "name", "values": ["amzn2-ami-hvm-*-x86_64-gp2"]}]
)

user_data = """
#!/bin/bash

// allow ssh access
	curl -s https://github.com/rufus-eade.keys | tee -a /home/ec2-user/.ssh/authorized_keys

// install relevant programs and start docker
	yum install -y \
	docker \
	vim \
	curl \
	git

usermod -aG docker ec2-user
systemctl start docker

// use a token with only package read access to access private github registry
echo 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 > /home/ec2-user/token.txt
cat /home/ec2-user/token.txt | docker login ghcr.io --username rufus-eade --password-stdin

// deploy our notes app on port 80
docker run -d \
--name notes \
-p 80:8080 \
ghcr.io/sds-warwick-2/assessment-2-aaf-internal-notes-system:main

// install watchtower for checking for changes on container "notes"
	docker run -d \
	--name watchtower \
-e REPO_USER=rufus-eade \
-e REPO_PASS=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 \
	-v /var/run/docker.sock:/var/run/docker.sock \
	containrrr/watchtower notes --interval 30 --cleanup
"""

ec2_instance = aws.ec2.Instance(
	"ec2-tutorial",
	instance_type="t2.micro",
	vpc_security_group_ids=[sg.id],
	ami=ami.id,
	user_data=user_data,
    subnet_id=public_subnet.id,
    associate_public_ip_address=True,
)

pulumi.export('publicIp', ec2_instance.public_ip)