import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { NATS_SERVICE, envs } from 'src/config';

@Module({
    imports: [
        ClientsModule.registerAsync( [
          {
            name: NATS_SERVICE,
            useFactory: () => ({
              transport: Transport.NATS,
              options: {
                servers: envs.natsServers,
              },
            }),
          },
        ]),
    ],
    exports: [
      ClientsModule
    ],
})
export class NatsModule {}
