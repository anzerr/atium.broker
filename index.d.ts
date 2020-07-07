
import * as events from 'events';

declare namespace conductorSocket {

	interface Logger {
		level: number;
		log(...arg: any): void;
		trace(...arg: any): void;
		debug(...arg: any): void;
		info(...arg: any): void;
		warn(...arg: any): void;
		error(...arg: any): void;
		fatal(...arg: any): void;
	}

	interface ClientConfig {
		socket: string;
		type: string;
		tasks: string[];
		api?: string;
    }

	interface ServerConfig {
		socket: string;
		api?: string;
		logger?: any | Logger;
	}
	
	class ServerChannel {

		send(shard: string, message: any): Promise<void>

	}

	class Server {

		channel: ServerChannel;

        constructor(options: ServerConfig);

        pool(): Promise<boolean>;

    }

	class Client {

		id: string;
		isAlive: boolean;
		config: ClientConfig;

        constructor(options: ClientConfig);

        reconnect(): void;

		send(action: string, data: any): Promise<any>;

		subscribe(channel: string): Promise<any>
		sub(channel: string): Promise<any>

		unsubscribe(channel: string): Promise<any>
		unsub(channel: string): Promise<any>

		event(channel: string, message: any): Promise<any>

		lock(): Promise<any>;

		tasks(t: any): Promise<any>;

		unlock(): Promise<any>;

		who(): Promise<any>;

		close(): void;

	}

	class Event extends events {

		config: ClientConfig;
		_client: any;

        constructor(options: ClientConfig);

		init(): Promise<void>;

		subscribe(channel: string): Promise<any>
		sub(channel: string): Promise<any>

		unsubscribe(channel: string): Promise<any>
		unsub(channel: string): Promise<any>

		event(channel: string, message: any): Promise<any>

		log(l: any[]): any;

		close(): void

	}

	class Task extends Event {

		who: string;

        constructor(options: ClientConfig);

		unlock(): Task;
		lock(): Task;
		run(task: any): Promise<any | void>

	}

}

export as namespace conductorSocket;
export = conductorSocket;